import { ShieldIcon, TruckIcon } from "@/components/ui/icons";

export function SupplierPanel({
  companyName,
  country,
}: {
  companyName: string;
  country: string;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-100 text-sm font-bold text-ink-500">
          {companyName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{companyName}</p>
          <p className="text-xs text-ink-400">Supplier · {country}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-ink-100 pt-3 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <ShieldIcon className="h-4 w-4 text-emerald-500" /> Sourced via Alibaba
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TruckIcon className="h-4 w-4 text-ink-400" /> Ships to Nepal
        </span>
      </div>
    </div>
  );
}
