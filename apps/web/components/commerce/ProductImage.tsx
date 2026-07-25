"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { PackageIcon } from "@/components/ui/icons";

/**
 * Product thumbnail with a graceful fallback. Alibaba CDN images vary wildly
 * (product-on-white, lifestyle, colored backdrops), so we frame every one on
 * a clean white surface with `object-contain` — the whole product shows,
 * uniformly, the way premium catalogs present a grid. Plain <img> (remote
 * Alibaba CDN hosts, not run through next/image optimization).
 */
export function ProductImage({
  src,
  alt,
  className,
  sizes,
  contain = true,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  contain?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-white", className)}>
      {showFallback ? (
        <PackageIcon className="h-8 w-8 text-ink-200" width={32} height={32} strokeWidth={1.5} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          sizes={sizes}
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full transition-transform duration-300 group-hover:scale-[1.04]",
            contain ? "object-contain p-2.5" : "object-cover",
          )}
        />
      )}
    </div>
  );
}
