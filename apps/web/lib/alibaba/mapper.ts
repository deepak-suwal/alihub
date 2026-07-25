/**
 * Parses Alibaba buyer-API responses into plain domain objects. Ported from
 * the removed backend upstream-mapper (the shapes were verified live against
 * /eco/buyer/product/search and /eco/buyer/product/description).
 */

export interface RawSearchItem {
  productId: string;
  title: string;
  priceUsdMin: number;
  priceUsdMax: number;
  image: string | null;
}
export interface RawSearchPage {
  items: RawSearchItem[];
  total: number;
  pageCount: number;
}

export interface RawTier {
  minQty: number;
  maxQty: number | null;
  unitPriceUsd: number;
}
export interface RawVariant {
  skuId: string;
  attributes: Record<string, string>;
  image: string | null;
}
export interface RawDetail {
  productId: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string | null;
  supplier: string | null;
  minOrderQuantity: number;
  unitType: string;
  images: string[];
  tiers: RawTier[];
  variants: RawVariant[];
}

/** Alibaba URLs arrive protocol-relative (//…) or bare host. */
function withHttps(url: string): string {
  if (!url) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http")) return url;
  return `https://${url}`;
}

/** "$84.08" or "$6.06-7.71" → { min, max } numbers. */
export function parsePriceRange(raw: unknown): { min: number; max: number } {
  const nums = String(raw ?? "").replace(/,/g, "").match(/\d+(\.\d+)?/g);
  if (!nums || nums.length === 0) return { min: 0, max: 0 };
  return { min: Number(nums[0]), max: Number(nums[nums.length - 1]) };
}

export function mapSearch(response: unknown): RawSearchPage {
  const data = (response as { result?: { data?: unknown } })?.result?.data as
    | {
        pagination?: Record<string, unknown>;
        products?: Array<{
          product_id?: number | string;
          title?: string;
          price?: string;
          image?: { main_image?: string };
        }>;
      }
    | undefined;
  const products = Array.isArray(data?.products) ? data!.products : [];
  const items: RawSearchItem[] = products.map((p) => {
    const price = parsePriceRange(p.price);
    return {
      productId: String(p.product_id ?? ""),
      title: String(p.title ?? ""),
      priceUsdMin: price.min,
      priceUsdMax: price.max,
      image: p.image?.main_image ? withHttps(p.image.main_image) : null,
    };
  });
  const pg = data?.pagination ?? {};
  return {
    items,
    total: Number(pg.total_product_count ?? items.length) || items.length,
    pageCount: Number(pg.page_count ?? 1) || 1,
  };
}

interface DetailData {
  product_id?: number | string;
  title?: string;
  description?: string;
  category?: string;
  category_id?: number | string;
  supplier?: string;
  min_order_quantity?: number;
  images?: string[];
  main_image?: string;
  wholesale_trade?: { unit_type?: string };
  skus?: Array<{
    sku_id?: number | string;
    image?: string;
    ladder_price?: Array<{ min_quantity?: number; max_quantity?: number; price?: number | string }>;
    sku_attr_list?: Array<{ attr_name_desc?: string; attr_value_desc?: string; attr_value_image?: string }>;
  }>;
}

export function mapDetail(response: unknown): RawDetail | null {
  const d = (response as { result?: { result_data?: DetailData } })?.result?.result_data;
  if (!d || d.product_id === undefined) return null;

  const images = [...new Set([d.main_image, ...(d.images ?? [])].filter((u): u is string => Boolean(u)).map(withHttps))];

  const tiers: RawTier[] = [...(d.skus?.[0]?.ladder_price ?? [])]
    .map((l) => ({
      minQty: Number(l.min_quantity ?? 0),
      maxQty: l.max_quantity === -1 || l.max_quantity === undefined ? null : Number(l.max_quantity),
      unitPriceUsd: Number(l.price ?? 0),
    }))
    .filter((t) => t.minQty > 0 && Number.isFinite(t.unitPriceUsd))
    .sort((a, b) => a.minQty - b.minQty);

  const ladderMoqs = (d.skus ?? [])
    .flatMap((s) => s.ladder_price ?? [])
    .map((l) => Number(l.min_quantity))
    .filter((n) => Number.isFinite(n) && n > 0);
  const minOrderQuantity =
    Number(d.min_order_quantity) > 0 ? Number(d.min_order_quantity) : ladderMoqs.length ? Math.min(...ladderMoqs) : 1;

  const variants: RawVariant[] = (d.skus ?? [])
    .map((s) => ({
      skuId: String(s.sku_id ?? ""),
      attributes: Object.fromEntries(
        (s.sku_attr_list ?? [])
          .filter((a) => a.attr_name_desc && a.attr_value_desc)
          .map((a) => [a.attr_name_desc as string, a.attr_value_desc as string]),
      ),
      image:
        (s.sku_attr_list ?? []).find((a) => a.attr_value_image)?.attr_value_image != null
          ? withHttps((s.sku_attr_list ?? []).find((a) => a.attr_value_image)!.attr_value_image!)
          : s.image
            ? withHttps(s.image)
            : null,
    }))
    .filter((v) => Object.keys(v.attributes).length > 0);

  return {
    productId: String(d.product_id),
    title: String(d.title ?? ""),
    description: String(d.description ?? ""),
    categoryId: String(d.category_id ?? ""),
    categoryName: d.category ? String(d.category) : null,
    supplier: d.supplier ? String(d.supplier) : null,
    minOrderQuantity,
    unitType: d.wholesale_trade?.unit_type ? String(d.wholesale_trade.unit_type) : "Piece",
    images,
    tiers,
    variants,
  };
}
