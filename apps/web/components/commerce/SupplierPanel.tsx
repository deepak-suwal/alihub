import { FactoryIcon } from "@/components/ui/icons";

/**
 * Supplier record — stated as facts on rules, in the design's idiom. Only
 * fields the Alibaba buyer API actually returns are shown; nothing is
 * invented to fill the grid.
 */
export function SupplierPanel({
  companyName,
  country,
}: {
  companyName: string;
  country: string;
}) {
  return (
    <div>
      <div className="lbl mb-3">Supplier record</div>
      <div className="flex items-center gap-2 border-b-2 border-divider pb-3 text-sm">
        <FactoryIcon className="h-4 w-4 shrink-0 text-neutral-700" />
        <span className="font-extrabold">{companyName}</span>
      </div>
      <table className="table table-flush text-[13px]">
        <tbody>
          <tr>
            <td className="text-neutral-700">Origin</td>
            <td className="text-right">{country}</td>
          </tr>
          <tr>
            <td className="text-neutral-700">Sourced via</td>
            <td className="text-right">Alibaba.com</td>
          </tr>
          <tr>
            <td className="text-neutral-700">Duty &amp; VAT</td>
            <td className="text-right">Paid by Alihub</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
