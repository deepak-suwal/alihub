import Link from "next/link";
import type { ProductSummary } from "@/lib/api";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white transition-shadow duration-200 hover:border-ink-300 hover:shadow-card-hover"
    >
      <div className="border-b border-ink-100 bg-ink-50/40">
        <ProductImage
          src={product.primaryImageUrl}
          alt={product.title}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
          className="aspect-square"
        />
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 min-h-[2.4rem] text-[0.82rem] font-medium leading-snug text-ink-700 group-hover:text-brand-700">
          {product.title}
        </h3>
        <div className="mt-auto pt-2">
          {product.startingPriceNpr ? (
            <p className="text-base font-bold tabular-nums text-ink-900">
              <span className="text-xs font-semibold text-ink-500">NPR</span> {product.startingPriceNpr}
              <span className="ml-1 text-xs font-normal text-ink-400">/unit</span>
            </p>
          ) : (
            <p className="text-sm text-ink-400">Price on request</p>
          )}
          <p className="mt-0.5 text-xs text-ink-400">
            MOQ {product.minOrderQty} {product.minOrderQty === 1 ? "unit" : "units"}
          </p>
        </div>
      </div>
    </Link>
  );
}
