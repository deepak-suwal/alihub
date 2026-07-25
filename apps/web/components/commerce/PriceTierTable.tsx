import type { PriceTier } from "@/lib/api";

function tierRange(tier: PriceTier, unit: string): string {
  if (tier.maxQty === null) return `≥ ${tier.minQty} ${unit}`;
  if (tier.minQty === tier.maxQty) return `${tier.minQty} ${unit}`;
  return `${tier.minQty} - ${tier.maxQty} ${unit}`;
}

/**
 * Alibaba-style quantity-break ("ladder") price table: the more you order,
 * the lower the per-unit NPR price. The signature element of the PDP.
 */
export function PriceTierTable({ tiers, unitType }: { tiers: PriceTier[]; unitType: string }) {
  const unit = `${unitType}s`.replace(/ss$/, "s");
  if (tiers.length === 0) return null;

  // Single-tier products don't need the ladder chrome — show one big price.
  if (tiers.length === 1) {
    const t = tiers[0];
    return (
      <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
        <p className="text-2xl font-bold text-brand-700">
          {t.unitPriceNpr ? `NPR ${t.unitPriceNpr}` : "Price on request"}
          <span className="ml-1 text-sm font-normal text-ink-400">/ {unitType.toLowerCase()}</span>
        </p>
        <p className="mt-0.5 text-xs text-ink-500">for orders of {t.minQty}+ {unit}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200">
      <div className="flex divide-x divide-ink-200 overflow-x-auto bg-ink-50">
        {tiers.map((tier, i) => (
          <div key={i} className="min-w-[7.5rem] flex-1 px-4 py-3">
            <p className="whitespace-nowrap text-xs font-medium text-ink-500">{tierRange(tier, unit)}</p>
            <p className="mt-1 whitespace-nowrap text-lg font-bold text-brand-700">
              {tier.unitPriceNpr ? `NPR ${tier.unitPriceNpr}` : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
