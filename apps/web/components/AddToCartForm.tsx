"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";

export function AddToCartForm({
  productId,
  slug,
  title,
  minOrderQty,
  imageUrl,
}: {
  productId: string;
  slug: string;
  title: string;
  minOrderQty: number;
  imageUrl?: string | null;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(minOrderQty);
  const [added, setAdded] = useState(false);

  const clamp = (n: number) => Math.max(minOrderQty, Number.isFinite(n) ? n : minOrderQty);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="qty" className="mb-1.5 block text-sm font-medium text-ink-700">
          Quantity <span className="font-normal text-ink-400">(MOQ {minOrderQty})</span>
        </label>
        <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-ink-200">
          <button
            type="button"
            onClick={() => setQty((q) => clamp(q - minOrderQty))}
            className="flex w-10 items-center justify-center bg-ink-50 text-lg text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-40"
            disabled={qty <= minOrderQty}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            id="qty"
            type="number"
            min={minOrderQty}
            value={qty}
            onChange={(e) => setQty(clamp(Number(e.target.value)))}
            className="w-20 border-x border-ink-200 text-center text-[0.95rem] font-semibold text-ink-900 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setQty((q) => clamp(q + minOrderQty))}
            className="flex w-10 items-center justify-center bg-ink-50 text-lg text-ink-600 transition-colors hover:bg-ink-100"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          size="lg"
          onClick={() => {
            addItem({ productId, slug, title, qty, minOrderQty, imageUrl });
            setAdded(true);
          }}
        >
          {added ? (
            <>
              <CheckIcon className="h-5 w-5" /> Added
            </>
          ) : (
            "Add to cart"
          )}
        </Button>
        {added ? (
          <Button variant="secondary" size="lg" onClick={() => router.push("/cart")}>
            View cart
          </Button>
        ) : null}
      </div>
    </div>
  );
}
