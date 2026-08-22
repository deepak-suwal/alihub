import Link from "next/link";
import type { ProductSummary } from "@/lib/api";
import { ProductImage } from "./ProductImage";

/**
 * Editorial product card: a bordered square image, a two-line title, and the
 * landed price set off below a 2px rule. No card chrome — the grid gap and
 * the rule do the separating.
 */
export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col">
      <div className="border border-divider bg-surface">
        <ProductImage
          src={product.primaryImageUrl}
          alt={product.title}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          className="aspect-square"
        />
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <h3 className="line-clamp-2 min-h-[38px] text-[15px] font-extrabold leading-[1.25] transition-colors group-hover:text-accent">
          {product.title}
        </h3>

        <div className="mt-auto border-t-2 border-divider pt-2.5">
          {product.startingPriceNpr ? (
            <>
              <div className="text-xl font-extrabold tabular-nums text-accent">
                {product.startingPriceNpr}
              </div>
              <div className="text-xs text-neutral-700">
                NPR landed / unit · MOQ {product.minOrderQty}
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-extrabold text-neutral-600">On request</div>
              <div className="text-xs text-neutral-700">MOQ {product.minOrderQty}</div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
