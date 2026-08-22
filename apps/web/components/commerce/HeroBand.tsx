import Link from "next/link";
import { CATEGORY_TILES } from "@/lib/home-collections";
import { CATEGORY_ICONS, FALLBACK_CATEGORY_ICON } from "./category-meta";
import { buttonClasses } from "@/components/ui/Button";
import { pricingRates } from "@/lib/pricing";

/**
 * Home masthead: a category index rail beside the statement of the whole
 * proposition — one rupee price, nothing added at the border. Split by 2px
 * rules rather than cards, per the design.
 */
export function HeroBand() {
  return (
    <section className="grid border-b-2 border-divider lg:grid-cols-[260px_1fr]">
      <CategoryRail />
      <Statement />
    </section>
  );
}

function CategoryRail() {
  return (
    <nav className="hidden border-r-2 border-divider py-5 lg:block" aria-label="All categories">
      <div className="lbl px-6 pb-3">All categories</div>
      <ul>
        {CATEGORY_TILES.map((tile) => {
          const Icon = CATEGORY_ICONS[tile.label] ?? FALLBACK_CATEGORY_ICON;
          return (
            <li key={tile.label}>
              <Link
                href={`/?q=${encodeURIComponent(tile.keyword)}`}
                className="flex items-center gap-3 border-t border-divider px-6 py-2.5 text-sm transition-colors hover:text-accent"
              >
                <Icon className="h-4 w-4 shrink-0 text-neutral-700" strokeWidth={1.75} />
                <span className="flex-1">{tile.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Statement() {
  const rates = pricingRates();
  return (
    <div className="flex flex-col justify-center px-6 py-12 lg:px-12">
      <div className="lbl mb-4 text-accent-700">Landed price, up front</div>
      <h1 className="mb-4 text-[40px] leading-[1.02] lg:text-[52px]">
        Source from Alibaba.
        <br />
        Pay one rupee price.
      </h1>
      <p className="mb-6 max-w-[460px] text-base text-neutral-800">
        Every price on Alihub already carries freight, customs duty, VAT and clearance. What you see
        is what lands in your shop — no surprise bill at the border.
      </p>
      <div className="mb-8 flex flex-wrap gap-3">
        <Link href="#catalog" className={buttonClasses("primary", "md")}>
          Browse the catalog
        </Link>
        <Link href="/cart" className={buttonClasses("secondary", "md")}>
          View sourcing list
        </Link>
      </div>

      <dl className="grid grid-cols-3 border-t-2 border-divider">
        <Stat value="40M+" label="Products priced in NPR" className="pr-4" />
        <Stat value={`${rates.customsDutyPercent}% + ${rates.vatPercent}%`} label="Duty & VAT, prepaid" className="px-4" />
        <Stat value={`Rs ${rates.fxUsdToNpr.toFixed(2)}`} label="USD rate applied today" className="pl-4" />
      </dl>
    </div>
  );
}

function Stat({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <div className={`pt-4 ${className ?? ""}`}>
      <dt className="text-[22px] font-extrabold tabular-nums">{value}</dt>
      <dd className="lbl mt-0.5">{label}</dd>
    </div>
  );
}
