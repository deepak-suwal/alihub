import Link from "next/link";
import { CartBadge } from "./CartBadge";
import { SearchBar } from "./commerce/SearchBar";
import { ShieldIcon, TagIcon } from "@/components/ui/icons";

export function SiteHeader() {
  return (
    <div className="sticky top-0 z-40">
      {/* Slim utility bar — trust cues, the way B2B marketplaces lead. */}
      <div className="hidden border-b border-ink-800/50 bg-ink-900 text-ink-300 sm:block">
        <div className="mx-auto flex h-9 max-w-content items-center justify-between px-6 text-xs">
          <span className="font-medium text-ink-100">Alihub — B2B sourcing for Nepal</span>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <TagIcon className="h-3.5 w-3.5 text-brand-300" /> Priced in NPR
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldIcon className="h-3.5 w-3.5 text-brand-300" /> Sourced via Alibaba
            </span>
          </div>
        </div>
      </div>

      {/* Main header — logo, persistent search, cart. */}
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-16 max-w-content items-center gap-4 px-4 sm:gap-6 sm:px-6">
          <Link href="/" className="flex shrink-0 items-baseline" aria-label="Alihub home">
            <span className="text-[1.35rem] font-bold tracking-tight text-ink-900">alihub</span>
            <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden />
          </Link>

          <div className="hidden max-w-2xl flex-1 sm:block">
            <SearchBar />
          </div>

          <nav className="ml-auto flex items-center gap-1 text-sm font-medium text-ink-600 sm:gap-2">
            <Link
              href="/"
              className="hidden rounded-lg px-3 py-2 transition-colors hover:bg-ink-100 hover:text-ink-900 md:block"
            >
              Browse
            </Link>
            <CartBadge />
          </nav>
        </div>

        {/* Mobile search row */}
        <div className="border-t border-ink-100 px-4 py-2.5 sm:hidden">
          <SearchBar />
        </div>
      </header>
    </div>
  );
}
