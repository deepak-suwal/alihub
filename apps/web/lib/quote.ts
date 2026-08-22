/**
 * Server-side re-pricing of a cart.
 *
 * The browser cart (lib/cart-context) holds only product ids and quantities —
 * deliberately no prices. Every amount a customer is charged is recomputed
 * here from live Alibaba data at checkout time, so a tampered client payload
 * can change *what* is ordered but never *what it costs*.
 *
 * SERVER-ONLY: pulls the signed Alibaba client. Import from route handlers /
 * Server Components only.
 */
import { callAlibaba, ALIBABA_PATHS } from "./alibaba/client";
import { mapDetail, type RawTier } from "./alibaba/mapper";
import { landedBreakdown } from "./pricing";

export interface QuoteRequestItem {
  productId: string;
  qty: number;
}

export interface QuoteLine {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  qty: number;
  minOrderQty: number;
  unitPriceUsd: number;
  unitPriceNpr: number;
  subtotalNpr: number;
  vatNpr: number;
  totalNpr: number;
}

export interface Quote {
  lines: QuoteLine[];
  subtotalNpr: number;
  vatNpr: number;
  totalNpr: number;
  /** Products dropped from the quote, with the reason (unavailable, no price…). */
  rejected: { productId: string; reason: string }[];
}

export class QuoteError extends Error {}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Ladder pricing: the applicable tier is the highest `minQty` at or below the
 * ordered quantity, skipping tiers whose `maxQty` the quantity exceeds.
 */
export function selectTier(tiers: RawTier[], qty: number): RawTier | null {
  const applicable = tiers
    .filter((t) => qty >= t.minQty && (t.maxQty === null || qty <= t.maxQty))
    .sort((a, b) => b.minQty - a.minQty);
  // Below the smallest tier (shouldn't happen once MOQ is enforced) fall back
  // to the cheapest rung rather than refusing to price the line.
  return applicable[0] ?? [...tiers].sort((a, b) => a.minQty - b.minQty)[0] ?? null;
}

async function quoteLine(item: QuoteRequestItem): Promise<QuoteLine> {
  const response = await callAlibaba(ALIBABA_PATHS.BUYER_PRODUCT_DESCRIPTION, {
    query_req: JSON.stringify({ product_id: Number(item.productId), language: "en", currency: "USD" }),
  });
  const detail = mapDetail(response);
  if (!detail) throw new QuoteError("Product is no longer listed on Alibaba");

  const qty = Math.max(Math.floor(item.qty), detail.minOrderQuantity);
  const tier = selectTier(detail.tiers, qty);
  if (!tier || !(tier.unitPriceUsd > 0)) {
    throw new QuoteError("Supplier does not publish an online price for this quantity");
  }

  const priced = landedBreakdown(tier.unitPriceUsd, qty);
  return {
    productId: detail.productId,
    slug: detail.productId,
    title: detail.title,
    imageUrl: detail.images[0] ?? null,
    qty,
    minOrderQty: detail.minOrderQuantity,
    unitPriceUsd: tier.unitPriceUsd,
    unitPriceNpr: priced.unitPriceNpr,
    subtotalNpr: priced.subtotalNpr,
    vatNpr: priced.vatNpr,
    totalNpr: priced.totalNpr,
  };
}

/** Prices every cart line against live Alibaba data. Lines are quoted in parallel. */
export async function quoteCart(items: QuoteRequestItem[]): Promise<Quote> {
  const unique = new Map<string, QuoteRequestItem>();
  for (const item of items) {
    const id = String(item.productId ?? "").trim();
    const qty = Math.floor(Number(item.qty));
    if (!id || !Number.isFinite(qty) || qty <= 0) continue;
    // Same product twice in one payload — merge rather than charge it twice.
    const existing = unique.get(id);
    unique.set(id, { productId: id, qty: existing ? existing.qty + qty : qty });
  }
  if (unique.size === 0) throw new QuoteError("Cart is empty");

  const settled = await Promise.allSettled([...unique.values()].map(quoteLine));

  const lines: QuoteLine[] = [];
  const rejected: Quote["rejected"] = [];
  [...unique.values()].forEach((item, i) => {
    const result = settled[i];
    if (result.status === "fulfilled") lines.push(result.value);
    else {
      rejected.push({
        productId: item.productId,
        reason: result.reason instanceof QuoteError ? result.reason.message : "Could not price this product",
      });
    }
  });

  if (lines.length === 0) {
    throw new QuoteError(rejected[0]?.reason ?? "None of the products in your cart could be priced");
  }

  return {
    lines,
    subtotalNpr: r2(lines.reduce((sum, l) => sum + l.subtotalNpr, 0)),
    vatNpr: r2(lines.reduce((sum, l) => sum + l.vatNpr, 0)),
    totalNpr: r2(lines.reduce((sum, l) => sum + l.totalNpr, 0)),
    rejected,
  };
}
