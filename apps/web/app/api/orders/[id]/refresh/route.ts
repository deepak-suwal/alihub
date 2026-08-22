/**
 * Re-asks the gateway about an unsettled order.
 *
 * A customer can return before the gateway has finished settling, or lose the
 * redirect entirely (closed tab, dropped connection). The blueprint answers
 * that with a polling worker; without one, this endpoint lets the order page
 * re-run the same authoritative verification on demand.
 */
import { NextResponse } from "next/server";
import { getProvider } from "@/lib/payments/registry";
import { PaymentGatewayError } from "@/lib/payments/types";
import { orderStore } from "@/lib/orders/store";
import { applyVerification, isExpired, publicOrder } from "@/lib/orders/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const store = orderStore();
  const order = await store.get(params.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (order.status === "PAID") {
    return NextResponse.json({ order: publicOrder(order), changed: false });
  }

  // Newest attempt first — that is the one the customer just went through.
  const attempt = [...order.attempts].reverse().find((a) => a.outcome !== "FAILED");
  if (!attempt) {
    return NextResponse.json({ order: publicOrder(order), changed: false });
  }

  const provider = getProvider(attempt.provider);
  if (!provider) return NextResponse.json({ error: "Unknown payment provider" }, { status: 400 });

  try {
    const result = await provider.verify(new URLSearchParams(), {
      reference: attempt.reference,
      gatewayReference: attempt.gatewayReference,
      amountNpr: order.totalNpr,
    });
    const { order: updated, transitioned } = await applyVerification(order, attempt, result);
    return NextResponse.json({
      order: publicOrder(updated),
      changed: transitioned,
      ...(result.status === "CONFIRMED" ? {} : { reason: result.reason }),
      expired: isExpired(updated),
    });
  } catch (error) {
    if (error instanceof PaymentGatewayError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("[orders/refresh] unexpected failure", error);
    return NextResponse.json({ error: "Could not check the payment status" }, { status: 500 });
  }
}
