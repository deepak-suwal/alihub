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

/** Per-category icon + tint, shared by the header rail and the category grid. */
export const CATEGORY_META: Record<string, { icon: LucideIcon; tint: string }> = {
  Electronics: { icon: Headphones, tint: "bg-blue-50 text-blue-600" },
  Lighting: { icon: Lightbulb, tint: "bg-amber-50 text-amber-600" },
  "Home & Kitchen": { icon: CookingPot, tint: "bg-rose-50 text-rose-600" },
  Apparel: { icon: Shirt, tint: "bg-violet-50 text-violet-600" },
  "Bags & Luggage": { icon: Luggage, tint: "bg-teal-50 text-teal-600" },
  Beauty: { icon: Sparkles, tint: "bg-pink-50 text-pink-600" },
  "Tools & Hardware": { icon: Wrench, tint: "bg-slate-100 text-slate-600" },
  "Sports & Outdoor": { icon: Dumbbell, tint: "bg-emerald-50 text-emerald-600" },
  "Toys & Kids": { icon: ToyBrick, tint: "bg-orange-50 text-orange-600" },
  "Auto & Parts": { icon: Car, tint: "bg-cyan-50 text-cyan-600" },
  Furniture: { icon: Armchair, tint: "bg-lime-50 text-lime-700" },
  "Phone Gear": { icon: Smartphone, tint: "bg-indigo-50 text-indigo-600" },
};

export const FALLBACK_CATEGORY_META = { icon: Package, tint: "bg-ink-100 text-ink-500" };
