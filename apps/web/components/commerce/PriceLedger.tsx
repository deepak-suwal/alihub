import type { PriceLedger as Ledger } from "@/lib/api";

/**
 * The "cost ledger" — treatment 1A from the design, chosen there as the
 * pricing presentation for the whole product surface.
 *
 * The argument the whole product makes is that the NPR figure is complete, so
 * the price is shown as an itemised account rather than a single number:
 * goods, freight, duty, VAT and service, adding to what you actually pay.
 */
export function PriceLedger({
  ledger,
  onSurface = true,
}: {
  ledger: Ledger;
  /** False when the ledger already sits on a tinted panel. */
  onSurface?: boolean;
}) {
  return (
    <div className={onSurface ? "bg-surface p-6" : ""}>
      <div className="lbl mb-1">Landed price, per {ledger.unitLabel}</div>
      <div className="mb-5 flex items-end gap-2">
        <span className="text-[38px] font-extrabold leading-none tabular-nums text-accent">
          {ledger.totalNpr}
        </span>
        <span className="pb-1.5 text-sm font-extrabold">NPR</span>
      </div>

      <table className="table table-flush text-[13px]">
        <tbody>
          {ledger.rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td className="text-right tabular-nums">{row.amountNpr}</td>
            </tr>
          ))}
          <tr>
            <td className="font-extrabold">You pay, delivered</td>
            <td className="text-right font-extrabold tabular-nums">{ledger.totalNpr}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-3 text-xs text-neutral-700">
        Nothing added at delivery. Duty and VAT are paid by Alihub and shown above.
      </p>
    </div>
  );
}
