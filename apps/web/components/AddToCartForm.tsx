"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";

/** Parses the server-formatted "1,234.56" back to a number for the running total. */
function parseNpr(formatted: string | undefined): number | null {
  if (!formatted) return null;
  const n = Number(formatted.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

const npr = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function AddToCartForm({
  productId,
  slug,
  title,
  minOrderQty,
  unitType = "Piece",
  unitPriceNpr,
  imageUrl,
}: {
  productId: string;
  slug: string;
  title: string;
  minOrderQty: number;
  unitType?: string;
  /** Unit price at MOQ, already formatted. Used for the indicative order total. */
  unitPriceNpr?: string;
  imageUrl?: string | null;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(minOrderQty);
  const [added, setAdded] = useState(false);

  const clamp = (n: number) => Math.max(minOrderQty, Number.isFinite(n) ? Math.floor(n) : minOrderQty);
  const unit = unitType.toLowerCase();
  const unitPrice = parseNpr(unitPriceNpr);

  // Quick jumps to the next ladder rungs, in the design's tag style.
  const jumps = [minOrderQty * 5, minOrderQty * 10, minOrderQty * 50].filter((n) => n > minOrderQty);

  return (
    <div>
      <div className="lbl mb-2.5">
        Quantity — MOQ {minOrderQty} {unit}
        {minOrderQty === 1 ? "" : "s"}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => setQty((q) => clamp(q - minOrderQty))}
            disabled={qty <= minOrderQty}
            className="flex h-11 w-11 items-center justify-center border border-divider bg-surface text-lg transition-colors hover:border-accent disabled:opacity-40 disabled:hover:border-divider"
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
            className="h-11 w-[120px] border-y border-divider bg-ground text-center text-base font-extrabold tabular-nums focus:outline-none"
            aria-label="Quantity"
          />
          <button
            type="button"
            onClick={() => setQty((q) => clamp(q + minOrderQty))}
            className="flex h-11 w-11 items-center justify-center border border-divider bg-surface text-lg transition-colors hover:border-accent"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {jumps.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQty(n)}
              className="tag tag-outline transition-colors hover:bg-accent hover:text-ground"
            >
              {n.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {unitPrice !== null ? (
        <p className="text-[13px] text-neutral-700">
          Order total{" "}
          <strong className="font-extrabold tabular-nums text-ink">NPR {npr(unitPrice * qty)}</strong>{" "}
          at this quantity
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
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
            "Add to sourcing list"
          )}
        </Button>
        {added ? (
          <Button variant="secondary" size="lg" onClick={() => router.push("/cart")}>
            View list
          </Button>
        ) : null}
      </div>
    </div>
  );
}
