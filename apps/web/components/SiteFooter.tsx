import Link from "next/link";
import { CATEGORY_TILES, POPULAR_SEARCHES } from "@/lib/home-collections";

/**
 * Production-style footer: brand column plus real navigation (categories and
 * popular searches are live search links), with payments and legal in the
 * bottom bar. Dark to bookend the utility bar at the top of the page.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink-900 text-ink-300">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Link href="/" className="inline-flex items-baseline" aria-label="Alihub home">
              <span className="text-xl font-bold tracking-tight text-white">alihub</span>
              <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-ink-400">
              B2B sourcing for Nepal. Live Alibaba prices converted to rupees with duties and
              delivery built in — pay locally, no international cards required.
            </p>
          </div>

          <FooterCol
            title="Marketplace"
            links={[
              { label: "Browse products", href: "/" },
              { label: "Cart", href: "/cart" },
            ]}
          />

          <FooterCol
            title="Categories"
            links={CATEGORY_TILES.slice(0, 6).map((tile) => ({
              label: tile.label,
              href: `/?q=${encodeURIComponent(tile.keyword)}`,
            }))}
          />

          <FooterCol
            title="Popular searches"
            links={POPULAR_SEARCHES.slice(0, 6).map((term) => ({
              label: term,
              href: `/?q=${encodeURIComponent(term)}`,
            }))}
          />
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-ink-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Alihub. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span>We accept</span>
            <span className="rounded border border-white/15 px-2 py-0.5 font-medium text-ink-300">ConnectIPS</span>
            <span className="rounded border border-white/15 px-2 py-0.5 font-medium text-ink-300">Fonepay</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-ink-300 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
