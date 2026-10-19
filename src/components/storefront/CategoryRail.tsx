import Link from "next/link";
import {
  Armchair, Bath, BedDouble, Boxes, CookingPot, Flower2, Home, Lamp, Lightbulb,
  Shirt, Sofa, Sparkles, Utensils,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/types";
import { AutoScrollRail } from "./AutoScrollRail";
import s from "./storefront.module.css";

const ICONS: Record<string, LucideIcon> = {
  kitchen: CookingPot,
  storage: Boxes,
  bathroom: Bath,
  dining: Utensils,
  bedroom: BedDouble,
  "living-room": Sofa,
  decor: Flower2,
  lighting: Lamp,
  cleaning: Sparkles,
  laundry: Shirt,
  textiles: BedDouble,
  furniture: Armchair,
  appliances: Lightbulb,
  garden: Flower2,
};

export function CategoryRail({ categories, locale }: { categories: Category[]; locale: string }) {
  return (
    <AutoScrollRail label="تصفح أقسام المتجر">
      {categories.map((category, index) => {
        const Icon = ICONS[category.slug] ?? Home;
        return (
          <Link key={category.slug} data-rail-item href={`/${locale}/products?category=${category.slug}`} className={s.categoryCard}>
            <span className={s.categorySymbol} data-tone={index % 6}><Icon size={58} strokeWidth={1.35} aria-hidden="true" /></span>
            <span className={s.categoryTitle}>{category.name}</span>
            <span className={s.categoryCta}>تصفح القسم</span>
          </Link>
        );
      })}
    </AutoScrollRail>
  );
}
