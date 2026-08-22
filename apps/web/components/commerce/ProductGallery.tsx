"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { ProductImage } from "./ProductImage";

export function ProductGallery({ images, title }: { images: { url: string }[]; title: string }) {
  const urls = images.map((i) => i.url).filter(Boolean);
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <ProductImage
        src={urls[active]}
        alt={title}
        sizes="(max-width: 1024px) 100vw, 560px"
        className="aspect-square border border-divider"
      />
      {urls.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {urls.slice(0, 5).map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "overflow-hidden  border transition-colors",
                i === active ? "border-accent " : "border-divider hover:border-neutral-500",
              )}
            >
              <ProductImage src={url} alt={`${title} thumbnail ${i + 1}`} className="aspect-square" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
