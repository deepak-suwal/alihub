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
    <section className="border-b-2 border-divider px-6 py-10 lg:px-12">
      <SectionHeading title={title} viewAllHref={`/?q=${encodeURIComponent(keyword)}`} />
      {/* Scrolls on small screens; settles into the design's 5-up grid on desktop. */}
      <div className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
        {items.slice(0, 10).map((product, i) => (
          <div
            key={product.id}
            className={`w-40 shrink-0 snap-start sm:w-48 lg:w-auto ${i >= 5 ? "lg:hidden" : ""}`}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
