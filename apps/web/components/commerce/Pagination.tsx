import Link from "next/link";
import { cn } from "@/lib/cn";

/** Builds a query string preserving the current search params, overriding page. */
function pageHref(base: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) if (v) params.set(k, v);
  params.set("page", String(page));
  return `/?${params.toString()}`;
}

export function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  const linkCls =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-ink-200 bg-white px-3 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50";
  const disabledCls = "pointer-events-none opacity-40";

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      <Link href={pageHref(params, prev)} className={cn(linkCls, page <= 1 && disabledCls)} aria-label="Previous page">
        ← Prev
      </Link>
      <span className="px-2 text-sm text-ink-500">
        Page <span className="font-semibold text-ink-800">{page}</span> of {totalPages}
      </span>
      <Link href={pageHref(params, next)} className={cn(linkCls, page >= totalPages && disabledCls)} aria-label="Next page">
        Next →
      </Link>
    </nav>
  );
}
