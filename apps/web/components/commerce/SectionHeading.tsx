import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";

/**
 * Section header: title and "view all" on one baseline, sitting on a 2px
 * rule. Used to open every band on the page.
 */
export function SectionHeading({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View all",
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-baseline justify-between gap-4 border-b-2 border-divider pb-3">
      <div className="flex items-baseline gap-4">
        <h2 className="text-[28px]">{title}</h2>
        {subtitle ? <span className="lbl">{subtitle}</span> : null}
      </div>
      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className="inline-flex shrink-0 items-center gap-1.5 text-[13px] text-accent-700 hover:text-accent"
        >
          {viewAllLabel} <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
