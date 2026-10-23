import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/types";
import { AutoScrollRail } from "./AutoScrollRail";
import s from "./storefront.module.css";
import { localeDirection, translate } from "@/lib/i18n";
import { orderCategories } from "@/lib/categories";

const SECTION_IMAGES = {
  gifts: "/sections/Elegant Gifts and Décor Display.png",
  organization: "/sections/Elegant Home Organization Display.png",
  kitchenware: "/sections/Elegant Kitchenware Collection.png",
  kitchenwareArabic: "/sections/Elegant Kitchenware Display with Arabic Sign.png",
  bathroom: "/sections/Elegant Marble Bathroom Accessories Display.png",
  flowers: "/sections/Flowers and Trees_ Boutique Floral Showcase.png",
  spices: "/sections/Indian Spice Market Still Life.png",
  tableSetting: "/sections/Luxurious Gold-Accented Table Setting.png",
  glassware: "/sections/Luxury Glassware and Tea Sets Display.png",
  cookware: "/sections/Luxury Gold-Accented Cookware Collection.png",
  bedding: "/sections/Luxury Home Bedding Collection.png",
  appliances: "/sections/Modern Kitchen Appliances Showcase.png",
  woodworks: "/sections/Rustic Wooden Kitchenware Collection.png",
  hospitality: "/sections/WhatsApp Image 2026-10-22 at 6.50.39 PM.jpeg",
} as const;

const STORE_CATEGORY_SECTION_IMAGES: Record<string, keyof typeof SECTION_IMAGES> = {
  category: "bedding",
  "category-2": "appliances",
  "category-3": "spices",
  "category-4": "cookware",
  "category-5": "organization",
  "category-6": "tableSetting",
  "category-7": "kitchenware",
  "category-8": "hospitality",
  "category-9": "woodworks",
  "category-10": "kitchenwareArabic",
  "category-11": "glassware",
  "category-12": "flowers",
  "category-13": "bathroom",
  "category-14": "gifts",
};

const CATEGORY_SECTION_IMAGES: Record<string, keyof typeof SECTION_IMAGES> = {
  kitchen: "kitchenware",
  storage: "organization",
  bathroom: "bathroom",
  dining: "tableSetting",
  bedroom: "bedding",
  "living-room": "gifts",
  decor: "gifts",
  lighting: "kitchenwareArabic",
  cleaning: "organization",
  laundry: "bedding",
  textiles: "bedding",
  furniture: "gifts",
  appliances: "appliances",
  garden: "flowers",
};

const CATEGORY_NAME_SECTION_IMAGES: Record<string, keyof typeof SECTION_IMAGES> = {
  "أدوات كهربائية": "appliances",
  "أدوات مطبخ": "kitchenware",
  "أدوات المطبخ": "kitchenware",
  "أدوات منزلية": "kitchenwareArabic",
  "اكسسوارات حمام": "bathroom",
  "إكسسوارات حمام": "bathroom",
  "الفرش المنزلي": "bedding",
  "تحف و هدايا": "gifts",
  "تحف وهدايا": "gifts",
  "ترتيب واستغلال المساحات": "organization",
  خشبيات: "woodworks",
  "دلات وضيافة": "hospitality",
  "دلالات وضيافة": "hospitality",
  "زجاجيات و فناجين": "glassware",
  "زجاجيات وفناجين": "glassware",
  سفرة: "tableSetting",
  "طناجر و قلايات": "cookware",
  "طناجر وقلايات": "cookware",
  هندي: "spices",
  "ورود و أشجار": "flowers",
  "ورود وأشجار": "flowers",
};

export function CategoryRail({ categories, locale }: { categories: Category[]; locale: string }) {
  const orderedCategories = orderCategories(categories);
  const cards = (
    <>
      {orderedCategories.map(({ category }) => {
        const sectionImage = CATEGORY_NAME_SECTION_IMAGES[category.name.trim()]
          ?? STORE_CATEGORY_SECTION_IMAGES[category.slug]
          ?? CATEGORY_SECTION_IMAGES[category.slug];
        const image = sectionImage ? SECTION_IMAGES[sectionImage] : undefined;
        return (
          <Link key={category.slug} data-rail-item href={`/${locale}/categories/${category.slug}`} className={s.categoryCard}>
            {image
              ? <span className={s.categoryImage}><Image src={image} alt={category.name} fill sizes="(max-width: 720px) 76vw, 220px" /></span>
              : <span className={s.categoryTitle}>{category.name}</span>}
          </Link>
        );
      })}
    </>
  );
  return (
    <AutoScrollRail label={translate(locale, "تصفح أقسام المتجر")} direction={localeDirection(locale)}>
      {cards}
    </AutoScrollRail>
  );
}
