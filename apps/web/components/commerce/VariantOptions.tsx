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
      <p className="mb-2 text-sm text-neutral-700">
        {name}: <span className="text-ink">{selected}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSelected(value)}
            className={cn(
              " border px-3 py-1.5 text-sm  transition-colors",
              value === selected
                ? "border-accent bg-accent-100 text-accent-700 "
                : "border-divider bg-ground text-neutral-800 hover:border-neutral-500",
            )}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}
