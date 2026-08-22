/**
 * Creates an order and starts a payment.
 *
 * The request supplies product ids, quantities and customer details — never
 * prices. The cart is re-quoted here against live Alibaba data and that quote
 * is what the customer is charged, so the amount the gateway sees was never
 * under the browser's control.
 */
import { NextResponse } from "next/server";
import { quoteCart, QuoteError, type QuoteRequestItem } from "@/lib/quote";
import { AlibabaError } from "@/lib/alibaba/client";
import { getProvider } from "@/lib/payments/registry";
import { PaymentConfigError, PaymentGatewayError } from "@/lib/payments/types";
import { orderStore, orderStoreIsDurable } from "@/lib/orders/store";
import { buildOrder, nextAttempt, publicOrigin } from "@/lib/orders/service";
import type { OrderCustomer } from "@/lib/orders/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckoutBody {
  items?: QuoteRequestItem[];
  customer?: Partial<OrderCustomer>;
  provider?: string;
}

const NEPALI_MOBILE = /^9\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCustomer(input: Partial<OrderCustomer> | undefined): OrderCustomer | { error: string } {
  const fullName = String(input?.fullName ?? "").trim();
  const phone = String(input?.phone ?? "").replace(/[\s-]/g, "");
  const address = String(input?.address ?? "").trim();
  const city = String(input?.city ?? "").trim();
  const email = String(input?.email ?? "").trim();
  const note = String(input?.note ?? "").trim();

  if (fullName.length < 2 || fullName.length > 80) return { error: "Enter your full name" };
  if (!NEPALI_MOBILE.test(phone)) return { error: "Enter a 10-digit mobile number starting with 9" };
  if (address.length < 5 || address.length > 200) return { error: "Enter a delivery address" };
  if (!city) return { error: "Enter your city" };
  if (email && !EMAIL.test(email)) return { error: "Enter a valid email address" };

  return {
    fullName,
    phone,
    address,
    city,
    ...(email ? { email } : {}),
    ...(note ? { note: note.slice(0, 500) } : {}),
  };
}

export async function POST(req: Request) {
  if (!orderStoreIsDurable() && process.env.NODE_ENV === "production") {
    // Without shared storage the order would not survive the redirect to the
    // gateway — better to refuse than to take money we cannot reconcile.
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please contact us to place this order." },
      { status: 503 },
    );
  }

  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const provider = getProvider(String(body.provider ?? ""));
  if (!provider) return NextResponse.json({ error: "Choose a payment method" }, { status: 400 });
  if (!provider.isConfigured()) {
    return NextResponse.json({ error: `${provider.label} is not available right now` }, { status: 503 });
  }

  const customer = validateCustomer(body.customer);
  if ("error" in customer) return NextResponse.json({ error: customer.error }, { status: 400 });

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
  }
  if (body.items.length > 50) {
    return NextResponse.json({ error: "Too many products in one order" }, { status: 400 });
  }

  const store = orderStore();

  try {
    const quote = await quoteCart(body.items);
    const order = buildOrder(quote, customer);
    const attempt = nextAttempt(order, provider.code);

    // Persist before contacting the gateway: an order with no payment is
    // recoverable, a payment with no order is not.
    order.attempts = [attempt];
    await store.put(order);
    await store.indexReference(attempt.reference, order.id);

    const instruction = await provider.createPayment({
      orderId: order.id,
      reference: attempt.reference,
      amountNpr: order.totalNpr,
      subtotalNpr: order.subtotalNpr,
      vatNpr: order.vatNpr,
      customer: { fullName: customer.fullName, phone: customer.phone, email: customer.email },
      origin: publicOrigin(req),
    });

    if (instruction.gatewayReference) {
      attempt.gatewayReference = instruction.gatewayReference;
      order.attempts = [attempt];
      await store.put(order);
      await store.indexReference(instruction.gatewayReference, order.id);
    }

    return NextResponse.json({
      orderId: order.id,
      totalNpr: order.totalNpr,
      rejected: quote.rejected,
      instruction,
    });
  } catch (error) {
    if (error instanceof QuoteError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof AlibabaError) {
      console.error("[checkout] Alibaba upstream failed", error);
      return NextResponse.json({ error: "Live pricing is unavailable right now" }, { status: 502 });
    }
    if (error instanceof PaymentConfigError) {
      console.error("[checkout] provider misconfigured", error);
      return NextResponse.json({ error: "This payment method is not configured" }, { status: 503 });
    }
    if (error instanceof PaymentGatewayError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("[checkout] unexpected failure", error);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
