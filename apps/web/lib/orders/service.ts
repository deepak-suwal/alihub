/**
 * Order lifecycle. Everything that mutates an order goes through here so the
 * invariants live in one place:
 *
 *   - the charged amount always comes from a fresh server-side quote;
 *   - a payment is applied at most once, whatever the gateway retries;
 *   - PAID is only ever reached from PENDING_PAYMENT.
 */
import { newOrderId, orderStore } from "./store";
import type { Order, OrderCustomer, OrderStatus, PaymentAttempt, ProviderCode } from "./types";
import type { Quote } from "../quote";
import type { VerificationResult } from "../payments/types";

/** How long a customer has to complete payment before the order lapses. */
const PAYMENT_WINDOW_MINUTES = 30;

function event(type: string, detail?: string) {
  return { at: new Date().toISOString(), type, ...(detail ? { detail } : {}) };
}

export function buildOrder(quote: Quote, customer: OrderCustomer): Order {
  const now = new Date();
  return {
    id: newOrderId(),
    status: "PENDING_PAYMENT",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PAYMENT_WINDOW_MINUTES * 60_000).toISOString(),
    customer,
    lines: quote.lines.map((l) => ({
      productId: l.productId,
      slug: l.slug,
      title: l.title,
      imageUrl: l.imageUrl,
      qty: l.qty,
      unitPriceUsd: l.unitPriceUsd,
      unitPriceNpr: l.unitPriceNpr,
      subtotalNpr: l.subtotalNpr,
      vatNpr: l.vatNpr,
      totalNpr: l.totalNpr,
    })),
    subtotalNpr: quote.subtotalNpr,
    vatNpr: quote.vatNpr,
    totalNpr: quote.totalNpr,
    attempts: [],
    events: [event("ORDER_CREATED", `Quoted at NPR ${quote.totalNpr.toFixed(2)}`)],
  };
}

/** Allocates the next attempt. Gateway references are never reused across retries. */
export function nextAttempt(order: Order, provider: ProviderCode): PaymentAttempt {
  const attempt = order.attempts.length + 1;
  return {
    attempt,
    provider,
    reference: `${order.id}-${attempt}`,
    createdAt: new Date().toISOString(),
    outcome: "INITIATED",
  };
}

export function isExpired(order: Order): boolean {
  return order.status === "PENDING_PAYMENT" && Date.parse(order.expiresAt) < Date.now();
}

/** Public-facing order view — drops internal pricing detail the customer has no use for. */
export function publicOrder(order: Order) {
  return {
    id: order.id,
    status: isExpired(order) ? ("EXPIRED" as OrderStatus) : order.status,
    createdAt: order.createdAt,
    customer: order.customer,
    lines: order.lines,
    subtotalNpr: order.subtotalNpr,
    vatNpr: order.vatNpr,
    totalNpr: order.totalNpr,
    payment: order.payment
      ? {
          provider: order.payment.provider,
          gatewayRef: order.payment.gatewayRef,
          confirmedAt: order.payment.confirmedAt,
        }
      : undefined,
  };
}

export interface ApplyResult {
  order: Order;
  /** True when this call is what moved the order to PAID. */
  transitioned: boolean;
}

/**
 * Applies a verification result to an order.
 *
 * Idempotency has two layers: a store-level claim on the gateway reference
 * (so concurrent callbacks race exactly once) and a status guard (so a claim
 * that somehow ran twice still cannot double-apply).
 */
export async function applyVerification(
  order: Order,
  attempt: PaymentAttempt,
  result: VerificationResult,
): Promise<ApplyResult> {
  const store = orderStore();

  if (result.status !== "CONFIRMED") {
    // Leave the order payable — a PENDING or failed attempt can be retried —
    // but record what the gateway said.
    const updated: Order = {
      ...order,
      updatedAt: new Date().toISOString(),
      attempts: order.attempts.map((a) =>
        a.reference === attempt.reference
          ? { ...a, outcome: result.status === "PENDING" ? a.outcome : ("FAILED" as const) }
          : a,
      ),
      events: [...order.events, event(`PAYMENT_${result.status}`, result.reason)],
    };
    await store.put(updated);
    return { order: updated, transitioned: false };
  }

  if (order.status === "PAID") return { order, transitioned: false };

  const claimed = await store.claimOnce(`${attempt.provider}:${attempt.reference}`);
  if (!claimed) {
    // Another callback for this same reference already applied the payment.
    return { order: (await store.get(order.id)) ?? order, transitioned: false };
  }

  const now = new Date().toISOString();
  const updated: Order = {
    ...order,
    status: "PAID",
    updatedAt: now,
    attempts: order.attempts.map((a) =>
      a.reference === attempt.reference ? { ...a, outcome: "CONFIRMED" as const } : a,
    ),
    payment: {
      provider: attempt.provider,
      reference: attempt.reference,
      gatewayRef: result.gatewayRef,
      amountNpr: result.amountNpr,
      confirmedAt: now,
    },
    events: [
      ...order.events,
      event("PAYMENT_CONFIRMED", `${attempt.provider} ref ${result.gatewayRef}`),
    ],
  };
  await store.put(updated);
  return { order: updated, transitioned: true };
}

/**
 * Absolute origin of this deployment. Gateways redirect the customer back to
 * URLs built from it, so it must be the public origin rather than whatever
 * internal host the request arrived on.
 */
export function publicOrigin(req: { url: string; headers: Headers }): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return new URL(req.url).origin;
}
