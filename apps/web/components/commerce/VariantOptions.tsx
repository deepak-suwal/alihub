"use client";

import { useMemo, useState } from "react";
import type { ProductVariant } from "@/lib/api";
import { cn } from "@/lib/cn";

/**
 * Groups the SKU list into per-attribute option chips (Color, Size, …), the
 * way Alibaba's variant selector works. Selection is presentational — the
 * cart is product-level — but it mirrors the real PDP and surfaces exactly
 * which options a supplier offers.
 */
export function VariantOptions({ variants }: { variants: ProductVariant[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const v of variants) {
      for (const [name, value] of Object.entries(v.attributes)) {
        const list = map.get(name) ?? [];
        if (!list.includes(value)) list.push(value);
        map.set(name, list);
      }
    }
    return [...map.entries()].map(([name, values]) => ({ name, values }));
  }, [variants]);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <OptionGroup key={group.name} name={group.name} values={group.values} />
      ))}
    </div>
  );
}

function OptionGroup({ name, values }: { name: string; values: string[] }) {
  const [selected, setSelected] = useState(values[0]);
  return (
    <div>
      <p className="mb-2 text-sm text-ink-500">
        {name}: <span className="font-medium text-ink-800">{selected}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSelected(value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              value === selected
                ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500"
                : "border-ink-200 bg-white text-ink-700 hover:border-ink-300",
            )}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}
