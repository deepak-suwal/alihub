import { SearchIcon } from "@/components/ui/icons";

/**
 * Native GET form — search is server-driven (URL is the source of truth),
 * so results are shareable/bookmarkable and work without client JS.
 *
 * The field and its button are butt-joined into one hard-edged unit, as in
 * the design: the input drops its right border so the two read as a single
 * rule-bounded control.
 */
export function SearchBar({ defaultQuery }: { defaultQuery?: string }) {
  return (
    <form className="flex" role="search">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder="Search 40M+ products — LED light, stainless bottle…"
          aria-label="Search products"
          className="input min-h-[44px] border-r-0 pl-9"
        />
      </div>
      <button type="submit" className="btn btn-primary min-h-[44px] px-6">
        Search
      </button>
    </form>
  );
}
