"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage } from "@/components/commerce/ProductImage";
import { CartIcon, TrashIcon } from "@/components/ui/icons";

export default function CartPage() {
  const { items, updateQty, removeItem } = useCart();
  const totalUnits = items.reduce((sum, i) => sum + i.qty, 0);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<CartIcon className="h-7 w-7" width={28} height={28} />}
        title="Your cart is empty"
        description="Browse the catalog and add products to start a sourcing list."
        action={
          <Link href="/" className={buttonClasses("primary", "md")}>
            Browse products
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Cart</h1>
        <span className="text-sm text-ink-400">
          {items.length} product{items.length === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-4 p-4">
            <Link
              href={`/products/${item.slug}`}
              className="shrink-0 overflow-hidden rounded-lg border border-ink-100"
            >
              <ProductImage src={item.imageUrl} alt={item.title} className="h-16 w-16" />
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.slug}`}
                className="line-clamp-2 text-sm font-semibold text-ink-900 hover:text-brand-700"
              >
                {item.title}
              </Link>
              <p className="mt-0.5 text-xs text-ink-400">
                MOQ {item.minOrderQty} {item.minOrderQty === 1 ? "unit" : "units"}
              </p>
            </div>

            <div className="flex items-center overflow-hidden rounded-lg border border-ink-200">
              <button
                type="button"
                onClick={() => updateQty(item.productId, Math.max(item.minOrderQty, item.qty - item.minOrderQty))}
                className="flex h-9 w-8 items-center justify-center bg-ink-50 text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-40"
                disabled={item.qty <= item.minOrderQty}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                type="number"
                min={item.minOrderQty}
                value={item.qty}
                onChange={(e) =>
                  updateQty(item.productId, Math.max(item.minOrderQty, Number(e.target.value) || item.minOrderQty))
                }
                className="h-9 w-14 border-x border-ink-200 text-center text-sm font-semibold tabular-nums focus:outline-none"
                aria-label={`Quantity for ${item.title}`}
              />
              <button
                type="button"
                onClick={() => updateQty(item.productId, item.qty + item.minOrderQty)}
                className="flex h-9 w-8 items-center justify-center bg-ink-50 text-ink-600 transition-colors hover:bg-ink-100"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label={`Remove ${item.title}`}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <div className="text-sm text-ink-600">
          <span className="font-semibold text-ink-900">{items.length}</span> product
          {items.length === 1 ? "" : "s"} · <span className="font-semibold text-ink-900">{totalUnits}</span> units
          in your cart.
        </div>
        <p className="mt-2 text-sm text-ink-500">
          Your cart is saved on this device. Continue to checkout to see the final landed NPR total — priced
          live from Alibaba — and pay with eSewa or Khalti.
        </p>
        <Link href="/checkout" className={buttonClasses("primary", "lg", "mt-4 w-full")}>
          Proceed to checkout
        </Link>
      </div>

      <div className="mt-4">
        <Link href="/" className="text-sm font-medium text-ink-500 hover:text-ink-800">
          ← Continue browsing
        </Link>
      </div>
    </div>
  );
}
