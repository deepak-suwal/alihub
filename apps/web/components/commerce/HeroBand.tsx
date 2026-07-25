import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CATEGORY_TILES, POPULAR_SEARCHES } from "@/lib/home-collections";
import { CATEGORY_META, FALLBACK_CATEGORY_META } from "./category-meta";
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
          const { icon: Icon, tint } = CATEGORY_META[tile.label] ?? FALLBACK_CATEGORY_META;
          return (
            <li key={tile.label}>
              <Link
                href={`/?q=${encodeURIComponent(tile.keyword)}`}
                className="group flex items-center gap-2.5 rounded-lg px-2.5 py-[0.4rem] text-sm text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${tint}`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 80% at 100% 0%, rgba(200,90,52,0.4), transparent 55%), radial-gradient(50% 60% at 0% 100%, rgba(21,32,50,0.9), transparent 60%)",
        }}
      />
      <div className="relative max-w-lg">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium tracking-wide text-brand-100">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          The B2B sourcing platform for Nepal
        </p>
        <h1 className="text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">
          Source millions of products, priced in <span className="text-brand-400">rupees</span>
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-200">
          Search Alibaba’s global catalog, see the landed NPR price up front, and buy locally.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-400">Popular</span>
          {POPULAR_SEARCHES.slice(0, 4).map((term) => (
            <Link
              key={term}
              href={`/?q=${encodeURIComponent(term)}`}
              className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-ink-200 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              {term}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom-anchored trust line fills the banner's height (matches the tall category rail). */}
      <div className="absolute inset-x-7 bottom-6 hidden items-center gap-6 border-t border-white/10 pt-5 text-xs text-ink-300 sm:inset-x-10 lg:flex">
        <span className="inline-flex items-center gap-1.5">
          <ShieldIcon className="h-3.5 w-3.5 text-brand-300" /> Verified Alibaba suppliers
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TagIcon className="h-3.5 w-3.5 text-brand-300" /> Live prices, landed in NPR
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TruckIcon className="h-3.5 w-3.5 text-brand-300" /> Delivered to Nepal
        </span>
      </div>
    </div>
  );
}
