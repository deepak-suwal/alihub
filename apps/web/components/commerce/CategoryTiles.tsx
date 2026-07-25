import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORY_TILES } from "@/lib/home-collections";
import { CATEGORY_META, FALLBACK_CATEGORY_META } from "./category-meta";
import { SectionHeading } from "./SectionHeading";

export function CategoryTiles() {
  return (
    <section>
      <SectionHeading title="Explore by category" subtitle="Jump straight into a sourcing category" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORY_TILES.map((tile) => {
          const { icon: Icon, tint } = CATEGORY_META[tile.label] ?? FALLBACK_CATEGORY_META;
          return (
            <Link
              key={tile.label}
              href={`/?q=${encodeURIComponent(tile.keyword)}`}
              className="group flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3 transition-all hover:border-brand-300 hover:shadow-card-hover"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
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
