import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/types";
import { AutoScrollRail } from "./AutoScrollRail";
import s from "./storefront.module.css";
import { localeDirection, translate } from "@/lib/i18n";

const ILLUSTRATIONS: Record<string, string> = {
  kitchen: "/categories/kitchen.svg",
  storage: "/categories/storage.svg",
  bathroom: "/categories/bathroom.svg",
  dining: "/categories/dining.svg",
  bedroom: "/categories/bedroom.svg",
  "living-room": "/categories/living-room.svg",
  decor: "/categories/decor.svg",
  lighting: "/categories/lighting.svg",
  cleaning: "/categories/cleaning.svg",
  laundry: "/categories/laundry.svg",
  textiles: "/categories/textiles.svg",
  furniture: "/categories/furniture.svg",
  appliances: "/categories/appliances.svg",
  garden: "/categories/garden.svg",
};

const STORE_CATEGORY_ILLUSTRATIONS: Record<string, string> = {
  category: "/categories/furnishings.svg",
  "category-2": "/categories/appliances.svg",
  "category-3": "/categories/indian.svg",
  "category-4": "/categories/cookware.svg",
  "category-5": "/categories/organization.svg",
  "category-6": "/categories/dining.svg",
  "category-7": "/categories/kitchen.svg",
  "category-8": "/categories/hospitality.svg",
  "category-9": "/categories/woodworks.svg",
  "category-10": "/categories/housewares.svg",
  "category-11": "/categories/glassware.svg",
  "category-12": "/categories/garden.svg",
  "category-13": "/categories/bathroom.svg",
  "category-14": "/categories/gifts.svg",
};

const CATEGORY_NAME_ILLUSTRATIONS: Record<string, string> = {
  "أدوات كهربائية": "/categories/appliances.svg",
  "أدوات مطبخ": "/categories/kitchen.svg",
  "أدوات المطبخ": "/categories/kitchen.svg",
  "أدوات منزلية": "/categories/housewares.svg",
  "اكسسوارات حمام": "/categories/bathroom.svg",
  "إكسسوارات حمام": "/categories/bathroom.svg",
  "الفرش المنزلي": "/categories/furnishings.svg",
  "تحف و هدايا": "/categories/gifts.svg",
  "تحف وهدايا": "/categories/gifts.svg",
  "ترتيب واستغلال المساحات": "/categories/organization.svg",
  خشبيات: "/categories/woodworks.svg",
  "دلات وضيافة": "/categories/hospitality.svg",
  "زجاجيات و فناجين": "/categories/glassware.svg",
  "زجاجيات وفناجين": "/categories/glassware.svg",
  سفرة: "/categories/dining.svg",
  "طناجر و قلايات": "/categories/cookware.svg",
  "طناجر وقلايات": "/categories/cookware.svg",
  هندي: "/categories/indian.svg",
  "ورود و أشجار": "/categories/garden.svg",
  "ورود وأشجار": "/categories/garden.svg",
};

export function CategoryRail({ categories, locale }: { categories: Category[]; locale: string }) {
  const cta = translate(locale, "تصفح القسم");
  return (
    <AutoScrollRail label={translate(locale, "تصفح أقسام المتجر")} direction={localeDirection(locale)}>
      {categories.map((category, index) => {
        const illustration = STORE_CATEGORY_ILLUSTRATIONS[category.slug]
          ?? ILLUSTRATIONS[category.slug]
          ?? CATEGORY_NAME_ILLUSTRATIONS[category.name.trim()]
          ?? "/categories/home.svg";
        return (
          <Link key={category.slug} data-rail-item href={`/${locale}/products?category=${category.slug}`} className={s.categoryCard}>
            <span className={s.categorySymbol} data-tone={index % 6}>
              <Image src={illustration} alt="" width={68} height={68} />
            </span>
            <span className={s.categoryTitle}>{category.name}</span>
            <span className={s.categoryCta}>{cta}</span>
          </Link>
        );
      })}
    </AutoScrollRail>
  );
}
