import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, NotFoundError, type ProductDetail } from "@/lib/api";
import { AddToCartForm } from "@/components/AddToCartForm";
import { ProductGallery } from "@/components/commerce/ProductGallery";
import { PriceTierTable } from "@/components/commerce/PriceTierTable";
import { VariantOptions } from "@/components/commerce/VariantOptions";
import { SupplierPanel } from "@/components/commerce/SupplierPanel";
import { Badge } from "@/components/ui/Badge";
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

  return (
    <div className="space-y-8">
      <nav className="text-sm text-ink-400">
        <Link href="/" className="hover:text-ink-700">
          Browse
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/?q=${encodeURIComponent(product.category.nameEn)}`} className="hover:text-ink-700">
          {product.category.nameEn}
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
        {/* Gallery — sticky on desktop so it stays in view while reading. */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={product.images} title={product.title} />
        </div>

        {/* Purchase column */}
        <div>
          <Badge tone="brand">{product.category.nameEn}</Badge>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ink-900">{product.title}</h1>
          <p className="mt-2 text-sm text-ink-500">
            MOQ <span className="font-semibold text-ink-800">{product.minOrderQty}</span> {product.unitType.toLowerCase()}
            {product.minOrderQty === 1 ? "" : "s"}
          </p>

          <div className="mt-5">
            <PriceTierTable tiers={product.priceTiers} unitType={product.unitType} />
          </div>

          {product.variants.length > 0 ? (
            <div className="mt-6">
              <VariantOptions variants={product.variants} />
            </div>
          ) : null}

          <div className="mt-6 rounded-xl border border-ink-200 bg-white p-5 shadow-card">
            <AddToCartForm
              productId={product.id}
              slug={product.slug}
              title={product.title}
              minOrderQty={product.minOrderQty}
              imageUrl={product.images[0]?.url ?? null}
            />
          </div>

          <div className="mt-5">
            <SupplierPanel companyName={product.supplier.companyName} country={product.supplier.country} />
          </div>
        </div>
      </div>

      {/* Full-width details below the fold. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
        <div />
        <div className="space-y-8">
          {specs.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Specifications</h2>
              <dl className="overflow-hidden rounded-xl border border-ink-200">
                {specs.map((spec, i) => (
                  <div
                    key={spec.name}
                    className={`flex gap-4 px-4 py-3 text-sm ${i % 2 ? "bg-white" : "bg-ink-50"}`}
                  >
                    <dt className="w-36 shrink-0 font-medium text-ink-500">{spec.name}</dt>
                    <dd className="text-ink-800">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {product.description ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Description</h2>
              <div
                className="prose-description"
                dangerouslySetInnerHTML={{ __html: sanitizeDescription(product.description) }}
              />
            </section>
          ) : null}
        </div>
      </div>
    </div>
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
