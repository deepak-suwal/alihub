import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";

/** Consistent section header with an accent rule and optional "view all" link. */
export function SectionHeading({
  title,
  subtitle,
  viewAllHref,
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-full bg-brand-500" />
          <h2 className="text-xl font-bold tracking-tight text-ink-900">{title}</h2>
        </div>
        {subtitle ? <p className="mt-1 pl-3.5 text-sm text-ink-500">{subtitle}</p> : null}
      </div>
      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          View all <ArrowRightIcon className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
