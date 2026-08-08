import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORY_TILES } from "@/lib/home-collections";
import { CATEGORY_ICONS, FALLBACK_CATEGORY_ICON } from "./category-meta";
import { SectionHeading } from "./SectionHeading";

export function CategoryTiles() {
  return (
    <section>
      <SectionHeading title="Explore by category" subtitle="Jump straight into a sourcing category" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORY_TILES.map((tile) => {
          const Icon = CATEGORY_ICONS[tile.label] ?? FALLBACK_CATEGORY_ICON;
          return (
            <Link
              key={tile.label}
              href={`/?q=${encodeURIComponent(tile.keyword)}`}
              className="group flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3 transition-colors hover:border-ink-300"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-100/80 text-ink-500 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="flex-1 text-sm font-semibold text-ink-800">{tile.label}</span>
              <ArrowRight className="h-4 w-4 text-ink-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
