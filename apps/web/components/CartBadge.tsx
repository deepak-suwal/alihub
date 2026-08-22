"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { ClipboardListIcon } from "@/components/ui/icons";

/** "Sourcing list" in the design's language — a buyer's working set, not a retail cart. */
export function CartBadge() {
  const { items } = useCart();
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <Link
      href="/cart"
      className="flex items-center gap-2 font-extrabold transition-colors hover:text-accent"
      aria-label={`Sourcing list${count > 0 ? `, ${count} units` : ", empty"}`}
    >
      <ClipboardListIcon className="h-[18px] w-[18px]" />
      <span className="hidden sm:inline">Sourcing list</span>
      {count > 0 ? (
        <span className="bg-accent px-[7px] py-px text-[13px] text-ground tabular-nums">{count}</span>
      ) : null}
    </Link>
  );
}
