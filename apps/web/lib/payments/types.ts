/**
 * Payment provider abstraction (blueprint §4.1), reduced to what the
 * storefront actually needs: start a payment, and verify one authoritatively.
 *
 * The contract each provider must honour:
 *   1. `createPayment` returns an *instruction* for the browser, never a
 *      completed payment.
 *   2. `verify` is the only thing that may declare a payment good, and it must
 *      reach the gateway's own status/lookup API. Redirect query parameters
 *      are attacker-controlled and are used solely to locate the transaction.
 */
import type { ProviderCode } from "../orders/types";

export interface CreatePaymentInput {
  orderId: string;
  /** Unique per attempt — eSewa refuses a reused transaction_uuid. */
  reference: string;
  amountNpr: number;
  subtotalNpr: number;
  vatNpr: number;
  customer: { fullName: string; phone: string; email?: string };
  /** Absolute origin of this deployment, e.g. https://alihub.com.np */
  origin: string;
}

/**
 * How the browser must hand the customer over to the gateway.
 *
 * `gatewayReference` is an identifier the gateway minted during initiation
 * (Khalti's `pidx`). It is persisted on the attempt and is what verification
 * looks the payment up by — binding the order to one specific gateway
 * transaction, so a completed payment for a different order of the same
 * amount cannot be replayed against this one.
 */
export type PaymentInstruction = (
  | { kind: "form_post"; action: string; fields: Record<string, string> }
  | { kind: "redirect"; url: string }
) & { gatewayReference?: string };

export type VerificationResult =
  | { status: "CONFIRMED"; gatewayRef: string; amountNpr: number; raw: unknown }
  | { status: "PENDING" | "FAILED" | "NOT_FOUND"; reason: string; raw: unknown };

/** What verification knows about the attempt it is confirming. */
export interface VerifyContext {
  reference: string;
  gatewayReference?: string;
  amountNpr: number;
}

export interface PaymentProvider {
  readonly code: ProviderCode;
  readonly label: string;
  /** False when the provider's credentials are missing — hidden at checkout. */
  isConfigured(): boolean;
  createPayment(input: CreatePaymentInput): Promise<PaymentInstruction>;
  /**
   * Confirms a payment against the gateway's status API.
   * `params` are the (untrusted) callback query parameters.
   */
  verify(params: URLSearchParams, ctx: VerifyContext): Promise<VerificationResult>;
}

export class PaymentConfigError extends Error {}
export class PaymentGatewayError extends Error {}

/** Amounts are compared to the paisa; anything else is a mismatch. */
export function amountsMatch(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}
