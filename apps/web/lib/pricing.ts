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

/** Round to 2dp for display. */
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function landedPrice(unitPriceUsd: number, qty: number): Landed {
  const q = Math.max(qty, 1);
  const landedCostNpr = unitPriceUsd * q * CONFIG.fxUsdToNpr;
  const freightNpr = CONFIG.freightNprPerUnit * q;
  const customsNpr = landedCostNpr * (CONFIG.customsDutyPercent / 100);
  const vatBaseNpr = landedCostNpr + freightNpr + customsNpr;
  const vatNpr = vatBaseNpr * CONFIG.vatRate;
  const marginNpr = vatBaseNpr * (CONFIG.marginPercent / 100);
  const totalNpr = vatBaseNpr + vatNpr + marginNpr;
  return { unitPriceNpr: r2(totalNpr / q), totalNpr: r2(totalNpr) };
}

/** Formats a number as an NPR amount string with thousands separators. */
export function formatNpr(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
