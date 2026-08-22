import { Suspense } from "react";
import { searchProducts, type ProductSearchResult } from "@/lib/api";
import Link from "next/link";
import { HeroBand } from "@/components/commerce/HeroBand";
import { ProductCard } from "@/components/commerce/ProductCard";
import { ProductRail } from "@/components/commerce/ProductRail";
import { CategoryTiles } from "@/components/commerce/CategoryTiles";
import { Pagination } from "@/components/commerce/Pagination";
import { ProductGridSkeleton } from "@/components/commerce/ProductCardSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  AlertIcon,
  PackageIcon,
  PackageSearchIcon,
  ReceiptIcon,
  ShieldIcon,
  TruckIcon,
} from "@/components/ui/icons";
import { pricingRates } from "@/lib/pricing";
import { HOME_RAILS, HOME_REVALIDATE } from "@/lib/home-collections";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const query = searchParams.q?.trim();

  // Results view (search is in the header). Browse view: compact hero + dense feeds.
  if (query) {
    return (
      <Suspense key={query + (searchParams.page ?? "1")} fallback={<SearchResultsSkeleton />}>
        <SearchResults query={query} page={searchParams.page} />
      </Suspense>
    );
  }

  return (
    <>
      <HeroBand />
      <Suspense fallback={<DiscoverySkeleton />}>
        <Discovery />
      </Suspense>
      <WhatThePriceContains />
      <CtaBand />
    </>
  );
}

/** The proposition, itemised — the home-page echo of the product cost ledger. */
function WhatThePriceContains() {
  const rates = pricingRates();
  return (
    <section className="border-b-2 border-divider px-6 py-10 lg:px-12">
      <h2 className="mb-5 text-[28px]">What the NPR price contains</h2>
      <div className="grid gap-12 lg:grid-cols-2">
        <table className="table table-flush">
          <tbody>
            <tr>
              <td>Supplier price, converted at USD 1 = NPR {rates.fxUsdToNpr.toFixed(2)}</td>
              <td className="lbl text-right">Live FX</td>
            </tr>
            <tr>
              <td>Sea freight, consolidation and inland haul</td>
              <td className="lbl text-right">Per unit</td>
            </tr>
            <tr>
              <td>Customs duty, paid at the border by Alihub</td>
              <td className="lbl text-right">{rates.customsDutyPercent}%</td>
            </tr>
            <tr>
              <td>Nepal VAT, invoiced to you with the order</td>
              <td className="lbl text-right">{rates.vatPercent}%</td>
            </tr>
            <tr>
              <td>Sourcing, inspection and clearance service</td>
              <td className="lbl text-right">{rates.marginPercent}%</td>
            </tr>
          </tbody>
        </table>

        <div className="grid gap-6 sm:grid-cols-2">
          {TRUST.map((t) => (
            <div key={t.title} className="flex flex-col gap-2 bg-surface p-5">
              <t.icon className="h-5 w-5 text-accent" />
              <div className="text-base font-extrabold">{t.title}</div>
              <p className="text-[13px] text-neutral-800">{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TRUST = [
  {
    icon: ShieldIcon,
    title: "Verified suppliers only",
    body: "Every listing comes from an Alibaba supplier we can trace, with trade history behind it.",
  },
  {
    icon: ReceiptIcon,
    title: "VAT invoice with every order",
    body: "Duty and VAT itemised against your PAN, ready for filing.",
  },
  {
    icon: TruckIcon,
    title: "Delivered, not dropped at the border",
    body: "Freight, clearance and the inland leg to your door are all in the quoted price.",
  },
  {
    icon: PackageSearchIcon,
    title: "Checked before it ships",
    body: "We inspect bulk orders at the factory, so faults are caught before they travel.",
  },
];

/** Closing prompt — nudges another search for anything not surfaced above. */
function CtaBand() {
  return (
    <section className="flex flex-col items-end justify-between gap-8 bg-accent px-6 py-14 text-ground sm:flex-row lg:px-12">
      <div>
        <div className="mb-4 text-[11px] uppercase tracking-[0.1em]">
          Can’t find it in the catalog?
        </div>
        <h2 className="max-w-[760px] text-[34px] leading-[1.05] text-ground lg:text-[44px]">
          Search 40M+ more products, priced landed in Kathmandu.
        </h2>
      </div>
      <Link href="/" className="btn min-h-[48px] shrink-0 bg-ground px-6 text-ink hover:bg-neutral-200">
        Start a search
      </Link>
    </section>
  );
}

async function Discovery() {
  const rails = await Promise.all(
    HOME_RAILS.map(async (rail) => ({ ...rail, items: await fetchRailItems(rail.keyword) })),
  );

  return (
    <div id="catalog">
      {/* Desktop gets the category rail in the hero; show the grid only on mobile. */}
      <div className="border-b-2 border-divider px-6 py-8 lg:hidden">
        <CategoryTiles />
      </div>
      {rails.map((rail) => (
        <ProductRail key={rail.title} title={rail.title} keyword={rail.keyword} items={rail.items} />
      ))}
    </div>
  );
}

async function SearchResults({ query, page }: { query: string; page?: string }) {
  let results: ProductSearchResult;
  try {
    results = await searchProducts({ q: query, page: Number(page ?? "1"), pageSize: 24 });
  } catch {
    return (
      <EmptyState
        icon={<AlertIcon className="h-7 w-7" width={28} height={28} />}
        title="Search temporarily unavailable"
        description="Please try again in a moment."
      />
    );
  }

  if (results.items.length === 0) {
    return (
      <EmptyState
        icon={<PackageIcon className="h-7 w-7" width={28} height={28} />}
        title={`No products match “${query}”`}
        description="Try a broader or different keyword — supplier listings change constantly."
      />
    );
  }

  return (
    <section className="px-6 py-10 lg:px-12">
      <div className="mb-6 flex items-baseline justify-between gap-4 border-b-2 border-divider pb-3">
        <h1 className="text-[28px]">
          Results for <span className="text-accent">“{query}”</span>
        </h1>
        <p className="lbl">{results.total.toLocaleString()} products</p>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {results.items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <Pagination page={results.page} totalPages={results.totalPages} params={{ q: query }} />
    </section>
  );
}

/**
 * Fetches one rail's products, cached for the home revalidate window. Retries
 * a transient empty/failed response with a fresh (uncached) call so a rail
 * never silently disappears or poisons the cache with an empty result.
 */
async function fetchRailItems(keyword: string): Promise<ProductSearchResult["items"]> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await searchProducts({
        q: keyword,
        pageSize: 12,
        revalidate: attempt === 1 ? HOME_REVALIDATE : undefined,
      });
      if (res.items.length > 0) return res.items;
    } catch {
      // retry
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 300 * attempt));
  }
  return [];
}

function DiscoverySkeleton() {
  return (
    <div className="space-y-12 px-6 py-10 lg:px-12">
      <div>
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, r) => (
        <div key={r}>
          <Skeleton className="mb-4 h-6 w-48" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 sm:w-48">
                <Skeleton className="aspect-square" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="px-6 py-10 lg:px-12">
      <Skeleton className="mb-4 h-6 w-56" />
      <ProductGridSkeleton count={15} />
    </div>
  );
}
