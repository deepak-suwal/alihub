/**
 * eSewa ePay v2.
 *
 * Flow: we render a signed, auto-submitting form POST to eSewa; the customer
 * authenticates there; eSewa redirects back to `success_url` with a base64
 * `data` blob. That blob is *not* trusted — it only tells us which transaction
 * to ask about. The transaction-status API is the authority.
 *
 * Signature: base64(HMAC-SHA256(secret, "k1=v1,k2=v2,…")) where the keys and
 * their order come from `signed_field_names`. The signed message must use the
 * exact characters sent in the form fields, so every amount goes through
 * `amountString`.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { amountString } from "../pricing";
import {
  PaymentConfigError,
  PaymentGatewayError,
  amountsMatch,
  type CreatePaymentInput,
  type PaymentInstruction,
  type PaymentProvider,
  type VerificationResult,
} from "./types";

// eSewa's published sandbox merchant. Real credentials must be supplied for live mode.
const UAT_PRODUCT_CODE = "EPAYTEST";
const UAT_SECRET_KEY = "8gBm/:&EnhH.1/q(";

const isLive = () => (process.env.ESEWA_MODE ?? "uat").toLowerCase() === "live";

function config() {
  const live = isLive();
  const productCode = process.env.ESEWA_PRODUCT_CODE ?? (live ? "" : UAT_PRODUCT_CODE);
  const secretKey = process.env.ESEWA_SECRET_KEY ?? (live ? "" : UAT_SECRET_KEY);
  return {
    live,
    productCode,
    secretKey,
    formUrl:
      process.env.ESEWA_FORM_URL ??
      (live
        ? "https://epay.esewa.com.np/api/epay/main/v2/form"
        : "https://rc-epay.esewa.com.np/api/epay/main/v2/form"),
    statusUrl:
      process.env.ESEWA_STATUS_URL ??
      (live
        ? "https://epay.esewa.com.np/api/epay/transaction/status/"
        : "https://rc.esewa.com.np/api/epay/transaction/status/"),
  };
}

/** Builds the "k=v,k=v" message and signs it. */
function signFields(fields: Record<string, string>, signedFieldNames: string, secretKey: string): string {
  const message = signedFieldNames
    .split(",")
    .map((name) => `${name}=${fields[name] ?? ""}`)
    .join(",");
  return createHmac("sha256", secretKey).update(message, "utf8").digest("base64");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** eSewa echoes amounts with separators ("1,000.0") — normalise before comparing. */
function parseAmount(raw: unknown): number {
  return Number(String(raw ?? "").replace(/,/g, ""));
}

interface EsewaCallbackData {
  transaction_code?: string;
  status?: string;
  total_amount?: string;
  transaction_uuid?: string;
  product_code?: string;
  signed_field_names?: string;
  signature?: string;
}

export const esewaProvider: PaymentProvider = {
  code: "esewa",
  label: "eSewa",

  isConfigured() {
    const { productCode, secretKey } = config();
    return Boolean(productCode && secretKey);
  },

  async createPayment(input: CreatePaymentInput): Promise<PaymentInstruction> {
    const { productCode, secretKey, formUrl } = config();
    if (!productCode || !secretKey) {
      throw new PaymentConfigError("eSewa live credentials (ESEWA_PRODUCT_CODE, ESEWA_SECRET_KEY) are not set");
    }

    // amount + tax_amount + service + delivery must equal total_amount exactly.
    const fields: Record<string, string> = {
      amount: amountString(input.subtotalNpr),
      tax_amount: amountString(input.vatNpr),
      total_amount: amountString(input.amountNpr),
      transaction_uuid: input.reference,
      product_code: productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      // The reference travels in the path: eSewa appends its own `?data=…`,
      // which would collide with a query parameter of ours.
      success_url: `${input.origin}/api/payments/esewa/callback/${encodeURIComponent(input.reference)}`,
      failure_url: `${input.origin}/api/payments/esewa/callback/${encodeURIComponent(input.reference)}`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };
    fields.signature = signFields(fields, fields.signed_field_names, secretKey);

    return { kind: "form_post", action: formUrl, fields };
  },

  async verify(params, order): Promise<VerificationResult> {
    const { productCode, secretKey, statusUrl } = config();

    // The `data` blob is optional (the failure_url carries none) and advisory.
    // When present, a bad signature means someone forged the redirect.
    const encoded = params.get("data");
    if (encoded) {
      let payload: EsewaCallbackData;
      try {
        payload = JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as EsewaCallbackData;
      } catch {
        return { status: "FAILED", reason: "Callback payload from eSewa was unreadable", raw: encoded };
      }

      if (payload.signature && payload.signed_field_names) {
        const expected = signFields(
          payload as unknown as Record<string, string>,
          payload.signed_field_names,
          secretKey,
        );
        if (!safeEqual(expected, payload.signature)) {
          return { status: "FAILED", reason: "eSewa callback signature did not verify", raw: payload };
        }
      }
      if (payload.transaction_uuid && payload.transaction_uuid !== order.reference) {
        return { status: "FAILED", reason: "eSewa callback referenced a different transaction", raw: payload };
      }
    }

    // Authoritative check — independent of anything the browser carried back.
    const query = new URLSearchParams({
      product_code: productCode,
      total_amount: amountString(order.amountNpr),
      transaction_uuid: order.reference,
    });

    let body: { status?: string; ref_id?: string; total_amount?: unknown };
    try {
      const res = await fetch(`${statusUrl}?${query}`, { cache: "no-store" });
      if (!res.ok) throw new PaymentGatewayError(`eSewa status HTTP ${res.status}`);
      body = (await res.json()) as typeof body;
    } catch (error) {
      throw new PaymentGatewayError(
        error instanceof Error ? `Could not reach eSewa: ${error.message}` : "Could not reach eSewa",
      );
    }

    const status = String(body.status ?? "").toUpperCase();
    if (status === "COMPLETE") {
      const paid = parseAmount(body.total_amount);
      if (Number.isFinite(paid) && !amountsMatch(paid, order.amountNpr)) {
        return {
          status: "FAILED",
          reason: `eSewa settled NPR ${paid} but the order total is NPR ${order.amountNpr}`,
          raw: body,
        };
      }
      return {
        status: "CONFIRMED",
        gatewayRef: String(body.ref_id ?? order.reference),
        amountNpr: order.amountNpr,
        raw: body,
      };
    }

    if (status === "PENDING" || status === "AMBIGUOUS") {
      return { status: "PENDING", reason: `eSewa reports the payment as ${status.toLowerCase()}`, raw: body };
    }
    if (status === "NOT_FOUND") {
      return { status: "NOT_FOUND", reason: "eSewa has no record of this transaction", raw: body };
    }
    return { status: "FAILED", reason: `eSewa reports the payment as ${status || "failed"}`, raw: body };
  },
};
