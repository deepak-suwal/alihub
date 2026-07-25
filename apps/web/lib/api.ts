/**
 * Catalog data layer — talks to the Alibaba buyer API DIRECTLY (server-side),
 * with NPR pricing applied here. There is no separate backend service; these
 * functions run in Server Components / route handlers only.
 */
import { callAlibaba, ALIBABA_PATHS } from "./alibaba/client";
import { mapSearch, mapDetail } from "./alibaba/mapper";
import { landedPrice, formatNpr } from "./pricing";

export interface ProductSummary {
  id: string;
  slug: string;
  title: string;
  minOrderQty: number;
  primaryImageUrl: string | null;
  startingPriceNpr: string | null;
}

export interface ProductSearchResult {
  items: ProductSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PriceTier {
  minQty: number;
  maxQty: number | null;
  unitPriceNpr: string | null;
}

export interface ProductVariant {
  id: string;
  attributes: Record<string, string>;
  image: string | null;
  stockQty: number | null;
}

export interface ProductDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  minOrderQty: number;
  unitType: string;
  images: { url: string; isPrimary: boolean }[];
  variants: ProductVariant[];
  supplier: { companyName: string; country: string; goldSupplier: boolean; rating: string | null };
  category: { id: string; nameEn: string; nameLocal: string | null };
  priceTiers: PriceTier[];
  priceAtMoq: { qty: number; unitPriceNpr: string; totalNpr: string };
}

export interface Category {
  id: string;
  nameEn: string;
  nameLocal: string | null;
  parentId: string | null;
}

/** Thrown so callers can distinguish "not found" from a transient upstream error. */
export class NotFoundError extends Error {}

/** Keyword search across the whole Alibaba catalog, priced in NPR. */
export async function searchProducts(input: {
  q: string;
  page?: number;
  pageSize?: number;
  revalidate?: number;
}): Promise<ProductSearchResult> {
  const page = input.page ?? 1;
  const pageSize = Math.min(input.pageSize ?? 24, 50);

  const response = await callAlibaba(
    ALIBABA_PATHS.BUYER_PRODUCT_SEARCH,
    { param0: JSON.stringify({ keyword: input.q, size: pageSize, index: page, language: "en", currency: "USD" }) },
    { revalidate: input.revalidate },
  );
  const { items, total } = mapSearch(response);

  return {
    items: items.map((p) => ({
      id: p.productId,
      slug: p.productId,
      title: p.title,
      minOrderQty: 1,
      primaryImageUrl: p.image,
      startingPriceNpr: p.priceUsdMin > 0 ? formatNpr(landedPrice(p.priceUsdMin, 1).unitPriceNpr) : null,
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Full product detail (ladder pricing in NPR, variants, supplier). */
export async function getProduct(id: string): Promise<ProductDetail> {
  const response = await callAlibaba(ALIBABA_PATHS.BUYER_PRODUCT_DESCRIPTION, {
    query_req: JSON.stringify({ product_id: Number(id), language: "en", currency: "USD" }),
  });
  const d = mapDetail(response);
  if (!d) throw new NotFoundError("Product not found on Alibaba");

  const tiers = d.tiers.length ? d.tiers : [{ minQty: d.minOrderQuantity, maxQty: null, unitPriceUsd: 0 }];
  const priceTiers: PriceTier[] = tiers.map((t) => ({
    minQty: t.minQty,
    maxQty: t.maxQty,
    unitPriceNpr: t.unitPriceUsd > 0 ? formatNpr(landedPrice(t.unitPriceUsd, t.minQty).unitPriceNpr) : null,
  }));

  const moqTier = tiers.find((t) => t.minQty <= d.minOrderQuantity) ?? tiers[0];
  const moq = landedPrice(moqTier.unitPriceUsd, d.minOrderQuantity);

  return {
    id: d.productId,
    slug: d.productId,
    title: d.title,
    description: d.description,
    minOrderQty: d.minOrderQuantity,
    unitType: d.unitType,
    images: d.images.map((url, i) => ({ url, isPrimary: i === 0 })),
    variants: d.variants.map((v) => ({ id: v.skuId, attributes: v.attributes, image: v.image, stockQty: null })),
    supplier: { companyName: d.supplier ?? "Alibaba supplier", country: "CN", goldSupplier: false, rating: null },
    category: { id: d.categoryId, nameEn: d.categoryName ?? "Products", nameLocal: null },
    priceTiers,
    priceAtMoq: {
      qty: d.minOrderQuantity,
      unitPriceNpr: formatNpr(moq.unitPriceNpr),
      totalNpr: formatNpr(moq.totalNpr),
    },
  };
}
