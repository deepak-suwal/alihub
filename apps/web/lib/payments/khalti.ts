/**
 * Khalti ePayment (KPG-2).
 *
 * Flow: server-to-server `initiate` returns a `pidx` and a hosted
 * `payment_url`; we redirect the customer there. On return, Khalti appends
 * status parameters to the return URL — all ignored except as a hint. The
 * `lookup` endpoint, queried with the `pidx` we stored at initiation, decides
 * whether the order is paid.
 *
 * Khalti transacts in paisa; NPR never crosses the wire.
 */
import { toPaisa } from "../pricing";
import {
  PaymentConfigError,
  PaymentGatewayError,
  amountsMatch,
  type CreatePaymentInput,
  type PaymentInstruction,
  type PaymentProvider,
  type VerificationResult,
  type VerifyContext,
} from "./types";

/** Khalti rejects anything under Rs 10. */
const MIN_NPR = 10;

const isLive = () => (process.env.KHALTI_MODE ?? "sandbox").toLowerCase() === "live";

function config() {
  const live = isLive();
  return {
    live,
    secretKey: process.env.KHALTI_SECRET_KEY ?? "",
    baseUrl: process.env.KHALTI_BASE_URL ?? (live ? "https://khalti.com" : "https://dev.khalti.com"),
  };
}

async function khaltiPost<T>(path: string, body: unknown): Promise<T> {
  const { secretKey, baseUrl } = config();
  if (!secretKey) throw new PaymentConfigError("KHALTI_SECRET_KEY is not set");

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Key ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    throw new PaymentGatewayError(
      error instanceof Error ? `Could not reach Khalti: ${error.message}` : "Could not reach Khalti",
    );
  }

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    throw new PaymentGatewayError(`Khalti returned a non-JSON response (HTTP ${res.status})`);
  }

  if (!res.ok) {
    // Khalti reports validation problems as {detail} or {field: [messages]}.
    const record = parsed as Record<string, unknown>;
    const detail =
      typeof record.detail === "string"
        ? record.detail
        : Object.entries(record)
            .map(([field, messages]) => `${field}: ${[messages].flat().join(", ")}`)
            .join("; ");
    throw new PaymentGatewayError(detail || `Khalti HTTP ${res.status}`);
  }
  return parsed as T;
}

interface InitiateResponse {
  pidx?: string;
  payment_url?: string;
  expires_at?: string;
}

interface LookupResponse {
  pidx?: string;
  /** In paisa. */
  total_amount?: number;
  status?: string;
  transaction_id?: string | null;
  refunded?: boolean;
}

export const khaltiProvider: PaymentProvider = {
  code: "khalti",
  label: "Khalti",

  isConfigured() {
    return Boolean(config().secretKey);
  },

  async createPayment(input: CreatePaymentInput): Promise<PaymentInstruction> {
    if (input.amountNpr < MIN_NPR) {
      throw new PaymentGatewayError(`Khalti does not accept payments below NPR ${MIN_NPR}`);
    }

    const response = await khaltiPost<InitiateResponse>("/api/v2/epayment/initiate/", {
      // Reference in the path — Khalti appends its own status query parameters.
      return_url: `${input.origin}/api/payments/khalti/callback/${encodeURIComponent(input.reference)}`,
      website_url: input.origin,
      amount: toPaisa(input.amountNpr),
      purchase_order_id: input.reference,
      purchase_order_name: `Alihub order ${input.orderId}`,
      customer_info: {
        name: input.customer.fullName,
        email: input.customer.email ?? "",
        phone: input.customer.phone,
      },
    });

    if (!response.payment_url || !response.pidx) {
      throw new PaymentGatewayError("Khalti did not return a payment link");
    }
    return { kind: "redirect", url: response.payment_url, gatewayReference: response.pidx };
  },

  async verify(params, ctx: VerifyContext): Promise<VerificationResult> {
    // The pidx we stored at initiation is the only one we will look up. A pidx
    // supplied in the callback must match it, or the redirect is not ours.
    const storedPidx = ctx.gatewayReference;
    if (!storedPidx) {
      return { status: "FAILED", reason: "This payment attempt has no Khalti reference", raw: null };
    }
    const returnedPidx = params.get("pidx");
    if (returnedPidx && returnedPidx !== storedPidx) {
      return { status: "FAILED", reason: "Khalti callback referenced a different payment", raw: returnedPidx };
    }

    const body = await khaltiPost<LookupResponse>("/api/v2/epayment/lookup/", { pidx: storedPidx });
    const status = String(body.status ?? "");

    if (status === "Completed") {
      if (body.refunded) {
        return { status: "FAILED", reason: "This Khalti payment has been refunded", raw: body };
      }
      const paidNpr = Number(body.total_amount ?? 0) / 100;
      if (!amountsMatch(paidNpr, ctx.amountNpr)) {
        return {
          status: "FAILED",
          reason: `Khalti settled NPR ${paidNpr} but the order total is NPR ${ctx.amountNpr}`,
          raw: body,
        };
      }
      return {
        status: "CONFIRMED",
        gatewayRef: String(body.transaction_id ?? storedPidx),
        amountNpr: ctx.amountNpr,
        raw: body,
      };
    }

    if (status === "Pending" || status === "Initiated") {
      return { status: "PENDING", reason: `Khalti reports the payment as ${status.toLowerCase()}`, raw: body };
    }
    if (status === "Expired") {
      return { status: "FAILED", reason: "The Khalti payment link expired", raw: body };
    }
    if (status === "User canceled") {
      return { status: "FAILED", reason: "The payment was cancelled at Khalti", raw: body };
    }
    return { status: "FAILED", reason: `Khalti reports the payment as ${status || "failed"}`, raw: body };
  },
};
