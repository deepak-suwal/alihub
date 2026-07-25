import { Input } from "@/components/ui/Input";
import { buttonClasses } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";

/**
 * Native GET form — search is server-driven (URL is the source of truth),
 * so results are shareable/bookmarkable and work without client JS. Lives in
 * the header (persistent) and on the results page.
 */
export function SearchBar({ defaultQuery }: { defaultQuery?: string }) {
  return (
    <form className="flex gap-2" role="search">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
        <Input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder="Search products, e.g. LED light, stainless bottle…"
          aria-label="Search products"
          className="h-11 rounded-full pl-11"
        />
      </div>
      <button type="submit" className={buttonClasses("primary", "md", "h-11 rounded-full px-6")}>
        Search
      </button>
    </form>
  );
}
