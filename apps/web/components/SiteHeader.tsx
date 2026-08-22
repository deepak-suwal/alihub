import Link from "next/link";
import { CartBadge } from "./CartBadge";
import { SearchBar } from "./commerce/SearchBar";

/** The wordmark: lowercase Archivo 800 plus a hard accent square. */
export function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <span className="font-extrabold tracking-[-0.02em]" style={{ fontSize: size }}>
        alihub
      </span>
      <span
        className="inline-block bg-accent"
        style={{ width: size / 3, height: size / 3 }}
        aria-hidden
      />
    </span>
  );
}

export function SiteHeader() {
  return (
    <div className="sticky top-0 z-40 bg-ground">
      {/* Utility strip — the design opens every screen with the trust line. */}
      <div className="hidden border-b border-divider sm:block">
        <div className="mx-auto flex max-w-content items-center justify-between px-6 py-2 text-[11px] uppercase tracking-[0.08em]">
          <span>B2B sourcing for Nepal · Kathmandu</span>
          <span className="flex gap-6">
            <span>Duty &amp; VAT included</span>
            <span>Verified suppliers only</span>
            <span>Pay with eSewa / Khalti</span>
          </span>
        </div>
      </div>

      <header className="border-b-2 border-divider">
        <div className="mx-auto flex max-w-content items-center gap-8 px-4 py-4 sm:px-6 lg:px-12">
          <Link href="/" aria-label="Alihub home">
            <Wordmark />
          </Link>

          <div className="hidden max-w-[620px] flex-1 md:block">
            <SearchBar />
          </div>

          <nav className="ml-auto flex items-center gap-6 text-sm">
            <Link href="/" className="hidden transition-colors hover:text-accent lg:block">
              Catalog
            </Link>
            <CartBadge />
          </nav>
        </div>

        {/* Mobile search row */}
        <div className="border-t border-divider px-4 py-2.5 md:hidden">
          <SearchBar />
        </div>
      </header>
    </div>
  );
}
