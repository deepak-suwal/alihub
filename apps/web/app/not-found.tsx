import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { PackageIcon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface text-neutral-600">
        <PackageIcon className="h-7 w-7" width={28} height={28} />
      </div>
      <p className="text-sm font-extrabold text-accent">404</p>
      <h1 className="mt-1 text-lg font-extrabold text-ink">Page not found</h1>
      <p className="mt-1.5 text-sm text-neutral-700">
        This product may have gone offline, or the link is incorrect.
      </p>
      <div className="mt-6">
        <Link href="/" className={buttonClasses("primary", "md")}>
          Back to browse
        </Link>
      </div>
    </div>
  );
}
