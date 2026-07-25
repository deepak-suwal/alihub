/**
 * The buyer sourcing API is keyword-only (no "list everything" endpoint),
 * so the home page discovers products the way Alibaba's own home does:
 * curated entry points. Category tiles deep-link into a keyword search;
 * product rails pre-run a search server-side (cached — see HOME_REVALIDATE).
 *
 * Keywords are chosen to return strong, representative product imagery.
 */

export interface CategoryTile {
  label: string;
  keyword: string;
  emoji: string;
}

export interface HomeRail {
  title: string;
  keyword: string;
}

export const CATEGORY_TILES: CategoryTile[] = [
  { label: "Electronics", keyword: "wireless earbuds", emoji: "🎧" },
  { label: "Lighting", keyword: "led light", emoji: "💡" },
  { label: "Home & Kitchen", keyword: "kitchenware", emoji: "🍳" },
  { label: "Apparel", keyword: "t-shirt", emoji: "👕" },
  { label: "Bags & Luggage", keyword: "backpack", emoji: "🎒" },
  { label: "Beauty", keyword: "skincare", emoji: "🧴" },
  { label: "Tools & Hardware", keyword: "power tools", emoji: "🔧" },
  { label: "Sports & Outdoor", keyword: "fitness equipment", emoji: "🏋️" },
  { label: "Toys & Kids", keyword: "toys", emoji: "🧸" },
  { label: "Auto & Parts", keyword: "car accessories", emoji: "🚗" },
  { label: "Furniture", keyword: "office chair", emoji: "🪑" },
  { label: "Phone Gear", keyword: "phone case", emoji: "📱" },
];

export const HOME_RAILS: HomeRail[] = [
  { title: "Top ranking · Electronics", keyword: "wireless earbuds" },
  { title: "Trending · Lighting", keyword: "led light" },
  { title: "Popular · Home & kitchen", keyword: "stainless steel bottle" },
  { title: "New arrivals · Bags", keyword: "backpack" },
];

/** Quick-search chips under the hero search box — the keyword-only catalog's shortcuts. */
export const POPULAR_SEARCHES: string[] = [
  "LED lights",
  "Phone cases",
  "Stainless steel bottle",
  "Backpack",
  "Power tools",
  "Wireless earbuds",
];

/** Home discovery is the same for everyone — cache it hard to spare the live API. */
export const HOME_REVALIDATE = 600; // 10 minutes
