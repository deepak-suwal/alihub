import {
  Headphones,
  Lightbulb,
  CookingPot,
  Shirt,
  Luggage,
  Sparkles,
  Wrench,
  Dumbbell,
  ToyBrick,
  Car,
  Armchair,
  Smartphone,
  Package,
  type LucideIcon,
} from "lucide-react";

/**
 * Per-category icon, shared by the header rail and the category grid.
 * Icons render in a single neutral tone (brand on hover) — the chip styling
 * lives in the consuming components so it stays consistent everywhere.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Electronics: Headphones,
  Lighting: Lightbulb,
  "Home & Kitchen": CookingPot,
  Apparel: Shirt,
  "Bags & Luggage": Luggage,
  Beauty: Sparkles,
  "Tools & Hardware": Wrench,
  "Sports & Outdoor": Dumbbell,
  "Toys & Kids": ToyBrick,
  "Auto & Parts": Car,
  Furniture: Armchair,
  "Phone Gear": Smartphone,
};

export const FALLBACK_CATEGORY_ICON: LucideIcon = Package;
