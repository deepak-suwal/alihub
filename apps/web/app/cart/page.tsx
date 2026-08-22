"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage } from "@/components/commerce/ProductImage";
import { ClipboardListIcon, TrashIcon } from "@/components/ui/icons";

export default function CartPage() {
  const { items, updateQty, removeItem } = useCart();
  const totalUnits = items.reduce((sum, i) => sum + i.qty, 0);

  if (items.length === 0) {
    return (
      <div className="px-6 py-16 lg:px-12">
        <EmptyState
          icon={<ClipboardListIcon className="h-7 w-7" width={28} height={28} />}
          title="Your sourcing list is empty"
          description="Browse the catalog and add products to start a sourcing list."
          action={
            <Link href="/" className={buttonClasses("primary", "md")}>
              Browse products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mb-6 flex items-baseline justify-between gap-4 border-b-2 border-divider pb-3">
        <h1 className="text-[28px]">Sourcing list</h1>
        <span className="lbl">
          {items.length} product{items.length === 1 ? "" : "s"} · {totalUnits} units
        </span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ul>
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-4 border-b border-divider py-4">
              <Link href={`/products/${item.slug}`} className="shrink-0 border border-divider">
                <ProductImage src={item.imageUrl} alt={item.title} className="h-16 w-16" />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.slug}`}
                  className="line-clamp-2 text-sm font-extrabold transition-colors hover:text-accent"
                >
                  {item.title}
                </Link>
                <p className="lbl mt-1">MOQ {item.minOrderQty}</p>
              </div>

              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() =>
                    updateQty(item.productId, Math.max(item.minOrderQty, item.qty - item.minOrderQty))
                  }
                  className="flex h-9 w-9 items-center justify-center border border-divider bg-surface transition-colors hover:border-accent disabled:opacity-40 disabled:hover:border-divider"
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
                    updateQty(
                      item.productId,
                      Math.max(item.minOrderQty, Number(e.target.value) || item.minOrderQty),
                    )
                  }
                  className="h-9 w-16 border-y border-divider bg-ground text-center text-sm font-extrabold tabular-nums focus:outline-none"
                  aria-label={`Quantity for ${item.title}`}
                />
                <button
                  type="button"
                  onClick={() => updateQty(item.productId, item.qty + item.minOrderQty)}
                  className="flex h-9 w-9 items-center justify-center border border-divider bg-surface transition-colors hover:border-accent"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="flex h-9 w-9 items-center justify-center text-neutral-600 transition-colors hover:text-accent"
                aria-label={`Remove ${item.title}`}
              >
                <TrashIcon className="h-[18px] w-[18px]" />
              </button>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="bg-surface p-6">
            <div className="lbl mb-3">This list</div>
            <table className="table table-flush text-[13px]">
              <tbody>
                <tr>
                  <td>Products</td>
                  <td className="text-right tabular-nums">{items.length}</td>
                </tr>
                <tr>
                  <td>Total units</td>
                  <td className="text-right tabular-nums">{totalUnits}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-xs text-neutral-700">
              Prices are confirmed at checkout against live Alibaba data, with freight, customs duty,
              VAT and service already included.
            </p>
            <Link href="/checkout" className={buttonClasses("primary", "lg", "mt-5 w-full")}>
              Proceed to checkout
            </Link>
          </div>

          <Link href="/" className="mt-4 inline-block text-sm text-neutral-700 hover:text-accent">
            ← Continue browsing
          </Link>
        </aside>
      </div>
    </div>
  );
}
