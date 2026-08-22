import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, NotFoundError, type ProductDetail } from "@/lib/api";
import { AddToCartForm } from "@/components/AddToCartForm";
import { ProductGallery } from "@/components/commerce/ProductGallery";
import { PriceTierTable } from "@/components/commerce/PriceTierTable";
import { PriceLedger } from "@/components/commerce/PriceLedger";
import { VariantOptions } from "@/components/commerce/VariantOptions";
import { SupplierPanel } from "@/components/commerce/SupplierPanel";
import { Badge } from "@/components/ui/Badge";
import { FactoryIcon } from "@/components/ui/icons";
import { sanitizeDescription } from "@/lib/sanitize";

async function loadProduct(slug: string): Promise<ProductDetail> {
  try {
    return await getProduct(slug);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const product = await getProduct(params.slug);
    return { title: product.title, description: product.title };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await loadProduct(params.slug);
  const specs = attributeSpecs(product);
  const unit = product.unitType.toLowerCase();

  return (
    <>
      <nav className="border-b border-divider px-6 py-4 text-xs text-neutral-700 lg:px-12">
        <Link href="/" className="hover:text-accent">
          Catalog
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/?q=${encodeURIComponent(product.category.nameEn)}`} className="hover:text-accent">
          {product.category.nameEn}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.title}</span>
      </nav>

      <div className="grid border-b-2 border-divider lg:grid-cols-[560px_1fr]">
        {/* Gallery + specifications */}
        <div className="border-divider px-6 py-8 lg:border-r-2 lg:px-12">
          <ProductGallery images={product.images} title={product.title} />

          {specs.length > 0 ? (
            <section className="mt-8 border-t-2 border-divider pt-5">
              <div className="lbl mb-4">Specifications</div>
              <table className="table table-flush">
                <tbody>
                  {specs.map((spec) => (
                    <tr key={spec.name}>
                      <td className="w-[150px] text-neutral-700">{spec.name}</td>
                      <td>{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
        </div>

        {/* Purchase column */}
        <div className="px-6 py-8 lg:px-12">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Badge tone="accent">{product.category.nameEn}</Badge>
            <Badge tone="neutral">Duty &amp; VAT included</Badge>
          </div>

          <h1 className="mb-3 max-w-[640px] text-[28px] leading-[1.08] lg:text-[34px]">
            {product.title}
          </h1>

          <div className="mb-6 flex flex-wrap items-center gap-4 border-b-2 border-divider pb-5 text-[13px] text-neutral-800">
            <span className="flex items-center gap-1.5">
              <FactoryIcon className="h-[15px] w-[15px]" />
              {product.supplier.companyName}
            </span>
            <span>·</span>
            <span>
              MOQ {product.minOrderQty} {unit}
              {product.minOrderQty === 1 ? "" : "s"}
            </span>
          </div>

          {/* The ladder beside the cost ledger — the design's core pairing. */}
          <div className="grid gap-8 xl:grid-cols-[1.15fr_1fr]">
            <div>
              <div className="lbl mb-3">Price ladder — landed NPR per {unit}</div>
              <PriceTierTable
                tiers={product.priceTiers}
                unitType={product.unitType}
                activeQty={product.minOrderQty}
              />
            </div>
            <PriceLedger ledger={product.priceLedger} />
          </div>

          {product.variants.length > 0 ? (
            <div className="mt-8 border-t-2 border-divider pt-6">
              <VariantOptions variants={product.variants} />
            </div>
          ) : null}

          <div className="mt-8 grid gap-8 border-t-2 border-divider pt-6 lg:grid-cols-2">
            <AddToCartForm
              productId={product.id}
              slug={product.slug}
              title={product.title}
              minOrderQty={product.minOrderQty}
              unitType={product.unitType}
              unitPriceNpr={product.priceAtMoq.unitPriceNpr}
              imageUrl={product.images[0]?.url ?? null}
            />
            <SupplierPanel
              companyName={product.supplier.companyName}
              country={product.supplier.country}
            />
          </div>
        </div>
      </div>

      {product.description ? (
        <section className="px-6 py-10 lg:px-12">
          <div className="lbl mb-4">Description</div>
          <div
            className="prose-description max-w-[900px]"
            dangerouslySetInnerHTML={{ __html: sanitizeDescription(product.description) }}
          />
        </section>
      ) : null}
    </>
  );
}

/** Collapse the variant attribute options into a spec list (name → all offered values). */
function attributeSpecs(product: ProductDetail): { name: string; value: string }[] {
  const map = new Map<string, Set<string>>();
  for (const v of product.variants) {
    for (const [name, value] of Object.entries(v.attributes)) {
      const set = map.get(name) ?? new Set<string>();
      set.add(value);
      map.set(name, set);
    }
  }
  return [...map.entries()].map(([name, values]) => ({ name, value: [...values].join(", ") }));
}
