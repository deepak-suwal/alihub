/**
 * Gateway return handler, shared by eSewa and Khalti.
 *
 * The attempt reference lives in the path rather than the query string: both
 * gateways append their own `?data=…` / `?pidx=…` to the URL we register, so a
 * query parameter of ours would risk being mangled.
 *
 * Nothing in the request is trusted. The parameters only identify which
 * transaction to ask about; the provider then confirms it against the
 * gateway's own status API before an order can become PAID.
 */
import { NextResponse } from "next/server";
import { getProvider } from "@/lib/payments/registry";
import { PaymentGatewayError } from "@/lib/payments/types";
import { orderStore } from "@/lib/orders/store";
import { applyVerification, publicOrigin } from "@/lib/orders/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** References are `${orderId}-${attempt}` — recover the order id if the index is cold. */
function orderIdFromReference(reference: string): string | null {
  const match = reference.match(/^(.+)-\d+$/);
  return match ? match[1] : null;
}

async function handle(req: Request, params: { provider: string; reference: string }) {
  const origin = publicOrigin(req);
  const fail = (reason: string, orderId?: string) =>
    NextResponse.redirect(
      orderId
        ? `${origin}/orders/${orderId}?error=${encodeURIComponent(reason)}`
        : `${origin}/checkout?error=${encodeURIComponent(reason)}`,
      { status: 303 },
    );

  const provider = getProvider(params.provider);
  if (!provider) return fail("Unknown payment provider");

  const reference = decodeURIComponent(params.reference);
  const store = orderStore();
  const orderId = (await store.resolveReference(reference)) ?? orderIdFromReference(reference);
  if (!orderId) return fail("We could not identify this payment");

  const order = await store.get(orderId);
  if (!order) return fail("We could not find this order");

  // Already settled — a repeated return trip is not an error.
  if (order.status === "PAID") {
    return NextResponse.redirect(`${origin}/orders/${order.id}`, { status: 303 });
  }

  const attempt = order.attempts.find((a) => a.reference === reference);
  if (!attempt) return fail("This payment does not belong to the order", order.id);

  const params_ = new URL(req.url).searchParams;

  try {
    const result = await provider.verify(params_, {
      reference: attempt.reference,
      gatewayReference: attempt.gatewayReference,
      amountNpr: order.totalNpr,
    });
    const { order: updated } = await applyVerification(order, attempt, result);

    if (result.status === "CONFIRMED") {
      return NextResponse.redirect(`${origin}/orders/${updated.id}?paid=1`, { status: 303 });
    }
    return fail(result.reason, updated.id);
  } catch (error) {
    if (error instanceof PaymentGatewayError) {
      // The customer may well have paid; we simply could not confirm it yet.
      console.error(`[callback:${provider.code}] verification unreachable`, error);
      return fail("We could not confirm your payment yet. It will update shortly.", order.id);
    }
    console.error(`[callback:${provider.code}] unexpected failure`, error);
    return fail("Something went wrong confirming your payment", order.id);
  }
}

export async function GET(req: Request, { params }: { params: { provider: string; reference: string } }) {
  return handle(req, params);
}

/** Some gateway configurations POST the return instead of redirecting with GET. */
export async function POST(req: Request, { params }: { params: { provider: string; reference: string } }) {
  return handle(req, params);
}
