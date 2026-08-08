import { Suspense } from "react";
import { searchProducts, type ProductSearchResult } from "@/lib/api";
import Link from "next/link";
import { HeroBand } from "@/components/commerce/HeroBand";
import { ProductCard } from "@/components/commerce/ProductCard";
import { ProductRail } from "@/components/commerce/ProductRail";
import { CategoryTiles } from "@/components/commerce/CategoryTiles";
import { Pagination } from "@/components/commerce/Pagination";
import { buttonClasses } from "@/components/ui/Button";
import { ProductGridSkeleton } from "@/components/commerce/ProductCardSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlertIcon, PackageIcon } from "@/components/ui/icons";
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
    <div className="space-y-10">
      <HeroBand />
      <Suspense fallback={<DiscoverySkeleton />}>
        <Discovery />
      </Suspense>
      <CtaBand />
    </div>
  );
}

/** Closing prompt — nudges another search for anything not surfaced above. */
function CtaBand() {
  return (
    <section className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-ink-200 bg-white px-6 py-7 text-center sm:flex-row sm:px-8 sm:text-left">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-ink-900 sm:text-xl">
          Can’t find what you’re sourcing?
        </h2>
        <p className="mt-1 max-w-lg text-sm text-ink-500">
          Search millions more products across Alibaba’s global catalog — priced in NPR, delivered to Nepal.
        </p>
      </div>
      <Link href="/" className={buttonClasses("primary", "md", "shrink-0")}>
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
    <div className="space-y-10">
      {/* Desktop gets the category rail in the hero; show the grid only on mobile. */}
      <div className="lg:hidden">
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
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-lg font-semibold text-ink-900">
          Results for <span className="text-brand-700">“{query}”</span>
        </h1>
        <p className="text-sm text-ink-400">{results.total.toLocaleString()} products</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
    <div className="space-y-12">
      <div>
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, r) => (
        <div key={r}>
          <Skeleton className="mb-4 h-6 w-48" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 sm:w-48">
                <Skeleton className="aspect-square rounded-xl" />
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
    <div>
      <Skeleton className="mb-4 h-6 w-56" />
      <ProductGridSkeleton count={15} />
    </div>
  );
}
