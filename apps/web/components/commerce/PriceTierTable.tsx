import type { PriceTier } from "@/lib/api";

function tierRange(tier: PriceTier, unit: string): string {
  if (tier.maxQty === null) return `${tier.minQty.toLocaleString()} ${unit} +`;
  if (tier.minQty === tier.maxQty) return `${tier.minQty.toLocaleString()} ${unit}`;
  return `${tier.minQty.toLocaleString()} – ${tier.maxQty.toLocaleString()} ${unit}`;
}

/** Percentage saved against the first (smallest-quantity) rung. */
function savingVsFirst(tiers: PriceTier[], index: number): string | null {
  const parse = (s: string | null) => (s ? Number(s.replace(/,/g, "")) : null);
  const base = parse(tiers[0].unitPriceNpr);
  const here = parse(tiers[index].unitPriceNpr);
  if (index === 0 || !base || !here || here >= base) return null;
  return `${Math.round((1 - here / base) * 100)}%`;
}

/**
 * The quantity ladder, as a ledger table: order more, pay less per unit. The
 * rung matching the customer's quantity is highlighted in accent-100 and set
 * in the heading weight.
 */
export function PriceTierTable({
  tiers,
  unitType,
  activeQty,
}: {
  tiers: PriceTier[];
  unitType: string;
  /** Quantity currently selected, so its rung can be marked. */
  activeQty?: number;
}) {
  const unit = `${unitType.toLowerCase()}s`.replace(/ss$/, "s");
  if (tiers.length === 0) return null;

  const activeIndex =
    activeQty === undefined
      ? -1
      : tiers.reduce(
          (best, t, i) =>
            activeQty >= t.minQty && (t.maxQty === null || activeQty <= t.maxQty) ? i : best,
          -1,
        );

  return (
    <table className="table table-flush">
      <thead>
        <tr>
          <th>Quantity</th>
          <th className="text-right">Landed / {unitType.toLowerCase()}</th>
          <th className="text-right">You save</th>
        </tr>
      </thead>
      <tbody>
        {tiers.map((tier, i) => {
          const active = i === activeIndex;
          const saving = savingVsFirst(tiers, i);
          return (
            <tr key={`${tier.minQty}-${i}`} className={active ? "bg-accent-100" : undefined}>
              <td className={active ? "font-extrabold" : undefined}>
                {tierRange(tier, unit)}
                {active ? <span className="tag tag-accent ml-2">Your qty</span> : null}
              </td>
              <td className={`text-right tabular-nums ${active ? "font-extrabold" : ""}`}>
                {tier.unitPriceNpr ?? "—"}
              </td>
              <td
                className={`text-right tabular-nums ${saving ? "text-accent-700" : "text-neutral-600"}`}
              >
                {saving ?? "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
