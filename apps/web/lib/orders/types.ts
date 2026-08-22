/** Order domain types shared by the store, the payment providers and the UI. */

export type ProviderCode = "esewa" | "khalti";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

export interface OrderCustomer {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  note?: string;
}

export interface OrderLine {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  qty: number;
  unitPriceUsd: number;
  unitPriceNpr: number;
  subtotalNpr: number;
  vatNpr: number;
  totalNpr: number;
}

/**
 * One initiation attempt. A gateway reference can never be reused — eSewa
 * rejects a repeated `transaction_uuid` — so a retry allocates a new attempt
 * with a fresh reference while staying on the same order.
 */
export interface PaymentAttempt {
  attempt: number;
  provider: ProviderCode;
  /** Our own per-attempt id: eSewa's `transaction_uuid`, Khalti's `purchase_order_id`. */
  reference: string;
  /** Identifier minted by the gateway at initiation (Khalti's `pidx`), if any. */
  gatewayReference?: string;
  createdAt: string;
  outcome: "INITIATED" | "CONFIRMED" | "FAILED";
}

export interface ConfirmedPayment {
  provider: ProviderCode;
  reference: string;
  /** The gateway's own transaction id (eSewa `ref_id`, Khalti `transaction_id`). */
  gatewayRef: string;
  amountNpr: number;
  confirmedAt: string;
}

export interface OrderEvent {
  at: string;
  type: string;
  detail?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  customer: OrderCustomer;
  lines: OrderLine[];
  subtotalNpr: number;
  vatNpr: number;
  totalNpr: number;
  attempts: PaymentAttempt[];
  payment?: ConfirmedPayment;
  events: OrderEvent[];
}
