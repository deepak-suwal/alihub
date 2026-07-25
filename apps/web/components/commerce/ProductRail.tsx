import type { ProductSummary } from "@/lib/api";
import { ProductCard } from "./ProductCard";
import { SectionHeading } from "./SectionHeading";

/**
 * A titled, horizontally-scrolling row of products — the home page's
 * curated feed. Scroll-snaps on touch; "View all" deep-links to the full
 * keyword search results.
 */
export function ProductRail({
  title,
  keyword,
  items,
}: {
  title: string;
  keyword: string;
  items: ProductSummary[];
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <SectionHeading title={title} viewAllHref={`/?q=${encodeURIComponent(keyword)}`} />
      <div className="relative">
        <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((product) => (
            <div key={product.id} className="w-40 shrink-0 snap-start sm:w-48">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        {/* Fade hint that the row scrolls further. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-l from-ink-50 to-transparent sm:block" />
      </div>
    </section>
  );
}
