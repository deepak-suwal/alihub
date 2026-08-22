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
              className="group flex items-center gap-3 border border-divider bg-surface p-3 transition-colors hover:border-accent"
            >
              <Icon className="h-5 w-5 shrink-0 text-neutral-700" strokeWidth={1.75} />
              <span className="flex-1 text-sm font-extrabold">{tile.label}</span>
              <ArrowRight className="h-4 w-4 text-neutral-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
