"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { CartIcon } from "@/components/ui/icons";

export function CartBadge() {
  const { items } = useCart();
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors hover:bg-ink-100 hover:text-ink-900"
      aria-label={`Cart${count > 0 ? `, ${count} items` : ", empty"}`}
    >
      <CartIcon className="h-5 w-5" />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 ? (
        <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
