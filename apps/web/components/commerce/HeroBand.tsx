import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CATEGORY_TILES, POPULAR_SEARCHES } from "@/lib/home-collections";
import { CATEGORY_ICONS, FALLBACK_CATEGORY_ICON } from "./category-meta";
import { ShieldIcon, TagIcon, TruckIcon } from "@/components/ui/icons";

/**
 * Compact, content-first hero (Alibaba-style): a category quick-nav rail on
 * the left and a promo banner on the right. Search lives in the header, so
 * this stays short and gets the user to categories/products immediately.
 */
export function HeroBand() {
  return (
    <section className="grid gap-4 lg:grid-cols-[236px_1fr]">
      <CategoryRail />
      <PromoBanner />
    </section>
  );
}

function CategoryRail() {
  return (
    <nav className="hidden overflow-hidden rounded-2xl border border-ink-200 bg-white lg:block">
      <p className="border-b border-ink-100 px-4 py-2.5 text-sm font-semibold text-ink-900">All categories</p>
      <ul className="p-1.5">
        {CATEGORY_TILES.map((tile) => {
          const Icon = CATEGORY_ICONS[tile.label] ?? FALLBACK_CATEGORY_ICON;
          return (
            <li key={tile.label}>
              <Link
                href={`/?q=${encodeURIComponent(tile.keyword)}`}
                className="group flex items-center gap-2.5 rounded-lg px-2.5 py-[0.4rem] text-sm text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-100/80 text-ink-500 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                <span className="flex-1 font-medium">{tile.label}</span>
                <ChevronRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function PromoBanner() {
  return (
    <div className="relative flex min-h-[300px] flex-col justify-center overflow-hidden rounded-2xl bg-ink-900 px-7 py-10 text-white sm:px-10 lg:pb-16">
      {/* One quiet corner glow — enough depth without reading as a template. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(70% 90% at 88% -12%, rgba(200,90,52,0.16), transparent 62%)",
        }}
      />
      <div className="relative max-w-lg">
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-brand-300">
          B2B sourcing for Nepal
        </p>
        <h1 className="text-3xl font-bold leading-[1.12] tracking-tight sm:text-4xl">
          Source millions of products, priced in rupees
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-300">
          Search Alibaba’s global catalog, see the landed NPR price up front, and buy locally.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
          <span className="mr-1 text-ink-400">Popular:</span>
          {POPULAR_SEARCHES.slice(0, 4).map((term) => (
            <Link
              key={term}
              href={`/?q=${encodeURIComponent(term)}`}
              className="rounded-full border border-white/10 px-3 py-1 text-ink-300 transition-colors hover:border-white/25 hover:text-white"
            >
              {term}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom-anchored trust line fills the banner's height (matches the tall category rail). */}
      <div className="absolute inset-x-7 bottom-6 hidden items-center gap-6 border-t border-white/10 pt-5 text-xs text-ink-400 sm:inset-x-10 lg:flex">
        <span className="inline-flex items-center gap-1.5">
          <ShieldIcon className="h-3.5 w-3.5" /> Verified Alibaba suppliers
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TagIcon className="h-3.5 w-3.5" /> Live prices, landed in NPR
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TruckIcon className="h-3.5 w-3.5" /> Delivered to Nepal
        </span>
      </div>
    </div>
  );
}
