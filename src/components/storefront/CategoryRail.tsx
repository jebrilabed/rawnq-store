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

const SUBCATEGORY_PARENT_IMAGES: Record<string, keyof typeof SECTION_IMAGES> = {
  category: "bedding",
  "category-2": "appliances",
  "category-4": "cookware",
  "category-5": "organization",
  "category-6": "tableSetting",
  "category-7": "kitchenware",
  "category-8": "hospitality",
  "category-10": "kitchenwareArabic",
  "category-11": "glassware",
  "category-12": "flowers",
  "category-14": "gifts",
  "category-49": "kitchenware",
  "category-50": "kitchenware",
};

const SUBCATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  "category-15": "/sections/الفرش المنزلي/أطقم حرامات ووسائد فاخرة.png",
  "category-16": "/sections/الفرش المنزلي/Elegant Arabic Pillow Display.png",
  "category-17": "/sections/الفرش المنزلي/بشاكير ومناشف بلمسة فاخرة.png",
  "category-18": "/sections/الفرش المنزلي/Elegant Doormat Display in Arabic.png",
  "category-19": "/sections/الفرش المنزلي/شراشف ورنرات بلمسة فاخرة.png",
  "category-20": "/sections/الفرش المنزلي/Elegant Woven Baskets and Tissue Display.png",
  "category-21": "/sections/الفرش المنزلي/Elegant Curtain Boutique Showcase.png",
  "category-22": "/sections/أدوات كهربائية/Gemini_Generated_Image_h7fgkmh7fgkmh7fg.jpeg",
  "category-23": "/sections/أدوات كهربائية/Gemini_Generated_Image_fvzun8fvzun8fvzu.jpeg",
  "category-24": "/sections/أدوات كهربائية/Luxury Irons and Electric Skewers Display.png",
  "category-25": "/sections/أدوات كهربائية/Luxurious Kitchen Scales Display with Arabic Banner.png",
  "category-26": "/sections/أدوات كهربائية/مقالي هوائية_ نكهات ذهبية في مطبخ عصري.png",
  "category-27": "/sections/أدوات كهربائية/Gemini_Generated_Image_5wz0sd5wz0sd5wz0.jpeg",
  "category-28": "/sections/أدوات كهربائية/مكانس كهربائية في غرفة معيشة أنيقة.png",
  "category-29": "/sections/أدوات كهربائية/Premium Home Electronics Showcase.png",
  "category-30": "/sections/أدوات كهربائية/Luxury Fan Showcase with Arabic Signage.png",
  "category-31": "/sections/أدوات كهربائية/Warmly Staged Heater Collection.png",
  "category-32": SECTION_IMAGES.cookware,
  "category-33": SECTION_IMAGES.cookware,
  "category-34": "/sections/ترتيب واستغلال المساحات/Gemini_Generated_Image_6b969r6b969r6b96.jpeg",
  "category-35": "/sections/ترتيب واستغلال المساحات/Gemini_Generated_Image_13vh2m13vh2m13vh.jpeg",
  "category-36": "/sections/ترتيب واستغلال المساحات/Gemini_Generated_Image_u6caq7u6caq7u6ca.jpeg",
  "category-37": "/sections/ترتيب واستغلال المساحات/Gemini_Generated_Image_hnuudohnuudohnuu.jpeg",
  "category-38": "/sections/ترتيب واستغلال المساحات/منظمات معالق أنيقة في مطبخ دافئ.png",
  "category-39": "/sections/ترتيب واستغلال المساحات/منظمات قماش في أجواء منزلية دافئة.png",
  "category-40": "/sections/ترتيب واستغلال المساحات/Gemini_Generated_Image_ganex2ganex2gane.jpeg",
  "category-41": "/sections/ترتيب واستغلال المساحات/Gemini_Generated_Image_dckgf7dckgf7dckg.jpeg",
  "category-42": "/sections/ترتيب واستغلال المساحات/Elegant Makeup Organizer Boutique Display.png",
  "category-43": "/sections/ترتيب واستغلال المساحات/منظمات منزلية متنوعة بأناقة دافئة.png",
  "category-44": SECTION_IMAGES.tableSetting,
  "category-45": SECTION_IMAGES.tableSetting,
  "category-46": SECTION_IMAGES.tableSetting,
  "category-47": SECTION_IMAGES.tableSetting,
  "category-48": SECTION_IMAGES.tableSetting,
  "category-49": "/sections/أدوات مطبخ/Luxury Cutlery and Knife Showcase.png",
  "category-50": "/sections/أدوات مطبخ/Elegant Kitchen Utensils and Tongs Display.png",
  "category-51": "/sections/أدوات مطبخ/Premium Cutting Boards Kitchen Display.png",
  "category-52": "/sections/أدوات مطبخ/Elegant Kettles and Arabic Coffee Pots.png",
  "category-53": "/sections/أدوات مطبخ/Luxury Baking Tools and Desserts Display.png",
  "category-54": "/sections/أدوات مطبخ/Warm Kitchen Spice Grinder Showcase.png",
  "category-55": "/sections/أدوات مطبخ/Cozy Modern Kitchen Accessories Display.png",
  "category-56": "/sections/أدوات مطبخ/Elegant Coffee Capsule Display.png",
  "category-57": "/sections/أدوات مطبخ/مراييل مطبخ أنيقة ودفء منزلي.png",
  "category-58": "/sections/أدوات مطبخ/Elegant Cutlery Kitchen Display.png",
  "category-59": "/sections/أدوات مطبخ/Premium Original Knives Display.png",
  "category-60": "/sections/أدوات مطبخ/Premium Knife Set Store Display.png",
  "category-61": "/sections/أدوات مطبخ/Warm Wooden Utensil Kitchen Display.png",
  "category-62": "/sections/أدوات مطبخ/Elegant Stainless Steel Ladles in a Cozy Kitchen.png",
  "category-64": "/sections/دلات وضيافة/Gemini_Generated_Image_fw5lcpfw5lcpfw5l.jpeg",
  "category-65": "/sections/دلات وضيافة/Gemini_Generated_Image_a57gjra57gjra57g.jpeg",
  "category-66": "/sections/دلات وضيافة/Gemini_Generated_Image_arelfdarelfdarel.jpeg",
  "category-67": "/sections/دلات وضيافة/Gemini_Generated_Image_mt8etkmt8etkmt8e.jpeg",
  "category-68": "/sections/دلات وضيافة/Gemini_Generated_Image_nksa0gnksa0gnksa.jpeg",
  "category-69": "/sections/أدوات منزلية/Luxury Arabic Home Fragrance Display.png",
  "category-70": "/sections/أدوات منزلية/Elegant Laundry Basket Display.png",
  "category-71": "/sections/أدوات منزلية/Modern Arabic Trash Bin Showroom Display.png",
  "category-72": "/sections/أدوات منزلية/Woven Straw Crafts Collection.png",
  "category-73": "/sections/أدوات منزلية/Luxurious Tables Living Room Vignette.png",
  "category-74": "/sections/أدوات منزلية/Modern Kitchen Storage Showroom Display.png",
  "category-75": "/sections/أدوات منزلية/Elegant Home Laundry Essentials Display.png",
  "category-76": "/sections/أدوات منزلية/Arabic Cleaning Supplies Display.png",
  "category-77": "/sections/أدوات منزلية/Elegant Tissue Box Collection.png",
  "category-79": "/sections/أدوات منزلية/Luxury Buffet Warmers in a Golden Kitchen.png",
  "category-80": "/sections/أدوات منزلية/Elegant Arabic Carafe Kitchen Display.png",
  "category-81": "/sections/أدوات منزلية/Portable Cooler Showroom Adventure.png",
  "category-82": SECTION_IMAGES.glassware,
  "category-83": SECTION_IMAGES.glassware,
  "category-84": SECTION_IMAGES.glassware,
  "category-85": SECTION_IMAGES.tableSetting,
  "category-88": SECTION_IMAGES.flowers,
  "category-89": "/sections/تحف و هدايا/لوحات وبراويز بلمسة عربية دافئة.png",
  "category-90": "/sections/تحف و هدايا/Luxury Watch Boutique Display.png",
  "category-91": "/sections/تحف و هدايا/Luxury Mirror Gallery Showroom.png",
  "category-92": "/sections/تحف و هدايا/شمعدانات فاخرة بإضاءة دافئة.png",
  "category-93": "/sections/تحف و هدايا/تحف وديكورات فاخرة بإضاءة دافئة.png",
  "category-94": "/sections/تحف و هدايا/Elegant Arabic Vase Boutique Display.png",
};

function subcategoryImage(category: Category, parentCategory?: Category): string | undefined {
  if (!parentCategory) return undefined;
  const image = SUBCATEGORY_IMAGE_BY_SLUG[category.slug];
  if (image) return image;
  const parentImage = SUBCATEGORY_PARENT_IMAGES[parentCategory.slug];
  return parentImage ? SECTION_IMAGES[parentImage] : undefined;
}

export function CategoryRail({ categories, locale, parentCategory }: { categories: Category[]; locale: string; parentCategory?: Category }) {
  const orderedCategories = orderCategories(categories);
  const cards = (
    <>
      {orderedCategories.map(({ category }) => {
        const image = subcategoryImage(category, parentCategory);
        const sectionImage = CATEGORY_NAME_SECTION_IMAGES[category.name.trim()]
          ?? STORE_CATEGORY_SECTION_IMAGES[category.slug]
          ?? CATEGORY_SECTION_IMAGES[category.slug];
        const categoryImage = image ?? (sectionImage ? SECTION_IMAGES[sectionImage] : undefined);
        return (
          <Link key={category.slug} data-rail-item href={`/${locale}/categories/${category.slug}`} className={s.categoryCard}>
            {categoryImage
              ? <span className={s.categoryImage}><Image src={categoryImage} alt={category.name} fill sizes="(max-width: 720px) 76vw, 220px" /></span>
              : <span className={s.categoryTitle}>{category.name}</span>}
          </Link>
        );
      })}
    </>
  );
  return (
    <AutoScrollRail label={translate(locale, "تصفح أقسام المتجر")} direction={localeDirection(locale)} interactiveClone>
      {cards}
    </AutoScrollRail>
  );
}
