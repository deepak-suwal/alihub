import Link from "next/link";
import { CATEGORY_TILES, POPULAR_SEARCHES } from "@/lib/home-collections";
import { Wordmark } from "./SiteHeader";

/**
 * Footer on the page ground, opened by a 2px rule — the design keeps the
 * whole surface light rather than bookending it with a dark band.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-2 border-divider">
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:px-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Alihub home" className="inline-block">
              <Wordmark size={20} />
            </Link>
            <p className="mt-3 max-w-[300px] text-[13px] text-neutral-700">
              B2B sourcing for Nepal. Live Alibaba prices converted to rupees with duties and
              delivery built in — pay locally, no international cards required.
            </p>
          </div>

          <FooterCol
            title="Marketplace"
            links={[
              { label: "Browse products", href: "/" },
              { label: "Sourcing list", href: "/cart" },
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

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-divider pt-6 text-xs text-neutral-700 sm:flex-row">
          <p>© {new Date().getFullYear()} Alihub. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span>We accept</span>
            <span className="border border-divider px-2 py-0.5">eSewa</span>
            <span className="border border-divider px-2 py-0.5">Khalti</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="lbl mb-3">{title}</h3>
      <ul className="flex flex-col gap-2 text-[13px]">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="transition-colors hover:text-accent">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
