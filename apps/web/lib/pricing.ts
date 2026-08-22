/**
 * USD → NPR landed-cost pricing, ported from the (now-removed) NestJS
 * pricing engine's computeLandedPrice (blueprint §6). Runs server-side in
 * the Next.js app. Rates are env-configurable so they can be tuned without
 * a code change; the defaults mirror the previous backend constants.
 *
 *   landedCostNpr = unitPriceUsd * qty * fxRate
 *   customsNpr    = landedCostNpr * customs%
 *   vatBaseNpr    = landedCostNpr + freightNpr + customsNpr
 *   vatNpr        = vatBaseNpr * 13%
 *   marginNpr     = vatBaseNpr * margin%
 *   totalNpr      = vatBaseNpr + vatNpr + marginNpr
 *   unitPriceNpr  = totalNpr / qty
 */
const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const CONFIG = {
  fxUsdToNpr: num(process.env.USD_NPR_RATE, 133.5),
  freightNprPerUnit: num(process.env.FREIGHT_NPR_PER_UNIT, 150),
  customsDutyPercent: num(process.env.CUSTOMS_DUTY_PERCENT, 15),
  marginPercent: num(process.env.MARGIN_PERCENT, 18),
  vatRate: num(process.env.VAT_RATE, 0.13),
};

export interface Landed {
  unitPriceNpr: number;
  totalNpr: number;
}

/**
 * Every component of a landed price, each already rounded to 2dp.
 *
 * `subtotalNpr + vatNpr === totalNpr` holds exactly (the total is summed from
 * the rounded parts, not rounded independently). Checkout depends on that
 * invariant: eSewa rejects a form whose `amount + tax_amount` does not equal
 * `total_amount` to the paisa.
 */
export interface LandedBreakdown extends Landed {
  qty: number;
  goodsNpr: number;
  freightNpr: number;
  customsNpr: number;
  marginNpr: number;
  vatNpr: number;
  /** Taxable value — everything except VAT. */
  subtotalNpr: number;
}

/** Round to 2dp for display. */
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function landedBreakdown(unitPriceUsd: number, qty: number): LandedBreakdown {
  const q = Math.max(qty, 1);
  const goodsNpr = unitPriceUsd * q * CONFIG.fxUsdToNpr;
  const freightNpr = CONFIG.freightNprPerUnit * q;
  const customsNpr = goodsNpr * (CONFIG.customsDutyPercent / 100);
  const vatBaseNpr = goodsNpr + freightNpr + customsNpr;
  const vatNpr = vatBaseNpr * CONFIG.vatRate;
  const marginNpr = vatBaseNpr * (CONFIG.marginPercent / 100);

  const subtotal = r2(vatBaseNpr + marginNpr);
  const vat = r2(vatNpr);
  const total = r2(subtotal + vat);

  return {
    qty: q,
    goodsNpr: r2(goodsNpr),
    freightNpr: r2(freightNpr),
    customsNpr: r2(customsNpr),
    marginNpr: r2(marginNpr),
    vatNpr: vat,
    subtotalNpr: subtotal,
    totalNpr: total,
    unitPriceNpr: r2(total / q),
  };
}

export function landedPrice(unitPriceUsd: number, qty: number): Landed {
  const { unitPriceNpr, totalNpr } = landedBreakdown(unitPriceUsd, qty);
  return { unitPriceNpr, totalNpr };
}

/**
 * The rates in force, for display. The design's "cost ledger" states each
 * rate alongside its amount ("Customs duty · 15%"), so the UI needs the
 * inputs, not just the results.
 */
export function pricingRates() {
  return {
    fxUsdToNpr: CONFIG.fxUsdToNpr,
    customsDutyPercent: CONFIG.customsDutyPercent,
    marginPercent: CONFIG.marginPercent,
    vatPercent: CONFIG.vatRate * 100,
  };
}

/** Formats a number as an NPR amount string with thousands separators. */
export function formatNpr(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Amount as a bare decimal string — no separators, always 2dp. Payment
 * gateways sign the exact characters sent, so form fields and the signature
 * message must be built from this one helper.
 */
export function amountString(n: number): string {
  return n.toFixed(2);
}

/** NPR → paisa (Khalti transacts in integer paisa). */
export function toPaisa(npr: number): number {
  return Math.round(npr * 100);
}
