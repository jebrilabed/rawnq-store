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

const SUBCATEGORY_IMAGES: Partial<Record<keyof typeof SECTION_IMAGES, { keywords: string[]; image: string }[]>> = {
  appliances: [
    { keywords: ["air fryer", "مقالي هوائية", "قلاية هوائية"], image: "/sections/أدوات كهربائية/مقالي هوائية_ نكهات ذهبية في مطبخ عصري.png" },
    { keywords: ["vacuum", "مكنسة", "مكانس"], image: "/sections/أدوات كهربائية/مكانس كهربائية في غرفة معيشة أنيقة.png" },
    { keywords: ["fan", "مروحة"], image: "/sections/أدوات كهربائية/Luxury Fan Showcase with Arabic Signage.png" },
    { keywords: ["iron", "مكواة", "أسياخ"], image: "/sections/أدوات كهربائية/Luxury Irons and Electric Skewers Display.png" },
    { keywords: ["heater", "مدفأة", "دفاية"], image: "/sections/أدوات كهربائية/Warmly Staged Heater Collection.png" },
    { keywords: ["scale", "ميزان"], image: "/sections/أدوات كهربائية/Luxurious Kitchen Scales Display with Arabic Banner.png" },
    { keywords: ["electronics", "إلكترونيات"], image: "/sections/أدوات كهربائية/Premium Home Electronics Showcase.png" },
    { keywords: ["appliance", "أجهزة", "جهاز كهربائي"], image: "/sections/أدوات كهربائية/Gemini_Generated_Image_5wz0sd5wz0sd5wz0.jpeg" },
  ],
  kitchenware: [
    { keywords: ["coffee capsule", "كبسولات", "قهوة"], image: "/sections/أدوات مطبخ/Elegant Coffee Capsule Display.png" },
    { keywords: ["cutlery", "ملاعق", "شوك", "سكاكين"], image: "/sections/أدوات مطبخ/Elegant Cutlery Kitchen Display.png" },
    { keywords: ["kettle", "غلاية", "دلة", "إبريق"], image: "/sections/أدوات مطبخ/Elegant Kettles and Arabic Coffee Pots.png" },
    { keywords: ["ladle", "مغارف", "مغرفة"], image: "/sections/أدوات مطبخ/Elegant Stainless Steel Ladles in a Cozy Kitchen.png" },
    { keywords: ["baking", "خبز", "معجنات"], image: "/sections/أدوات مطبخ/Luxury Baking Tools and Desserts Display.png" },
    { keywords: ["knife", "سكين", "سكاكين"], image: "/sections/أدوات مطبخ/Luxury Cutlery and Knife Showcase.png" },
    { keywords: ["cutting board", "لوح تقطيع", "ألواح تقطيع"], image: "/sections/أدوات مطبخ/Premium Cutting Boards Kitchen Display.png" },
    { keywords: ["spice grinder", "مطحنة", "طاحونة"], image: "/sections/أدوات مطبخ/Warm Kitchen Spice Grinder Showcase.png" },
    { keywords: ["wooden", "خشبي", "خشبيات"], image: "/sections/أدوات مطبخ/Warm Wooden Utensil Kitchen Display.png" },
    { keywords: ["apron", "مريول", "مراييل"], image: "/sections/أدوات مطبخ/مراييل مطبخ أنيقة ودفء منزلي.png" },
    { keywords: ["utensil", "أدوات مطبخ", "ملاقط"], image: "/sections/أدوات مطبخ/Elegant Kitchen Utensils and Tongs Display.png" },
  ],
  organization: [
    { keywords: ["makeup", "مكياج", "تجميل"], image: "/sections/ترتيب واستغلال المساحات/Elegant Makeup Organizer Boutique Display.png" },
    { keywords: ["fabric", "قماش", "ملابس"], image: "/sections/ترتيب واستغلال المساحات/منظمات قماش في أجواء منزلية دافئة.png" },
    { keywords: ["cutlery", "ملاعق", "أدراج", "أدوات مطبخ"], image: "/sections/ترتيب واستغلال المساحات/منظمات معالق أنيقة في مطبخ دافئ.png" },
    { keywords: ["organizer", "منظم", "منظمات", "تخزين"], image: "/sections/ترتيب واستغلال المساحات/منظمات منزلية متنوعة بأناقة دافئة.png" },
  ],
  kitchenwareArabic: [
    { keywords: ["clean", "تنظيف", "منظفات"], image: "/sections/أدوات منزلية/Arabic Cleaning Supplies Display.png" },
    { keywords: ["laundry basket", "سلة غسيل", "سلال غسيل"], image: "/sections/أدوات منزلية/Elegant Laundry Basket Display.png" },
    { keywords: ["laundry", "غسيل", "ملابس"], image: "/sections/أدوات منزلية/Elegant Home Laundry Essentials Display.png" },
    { keywords: ["tissue", "مناديل"], image: "/sections/أدوات منزلية/Elegant Tissue Box Collection.png" },
    { keywords: ["living room", "معطر", "عطور", "مباخر"], image: "/sections/أدوات منزلية/Luxury Arabic Home Fragrance Display.png" },
    { keywords: ["warmer", "سخان", "حافظة طعام"], image: "/sections/أدوات منزلية/Luxury Buffet Warmers in a Golden Kitchen.png" },
    { keywords: ["trash", "قمامة", "نفايات"], image: "/sections/أدوات منزلية/Modern Arabic Trash Bin Showroom Display.png" },
    { keywords: ["storage", "تخزين", "حافظات"], image: "/sections/أدوات منزلية/Modern Kitchen Storage Showroom Display.png" },
    { keywords: ["cooler", "مبرد", "كولر"], image: "/sections/أدوات منزلية/Portable Cooler Showroom Adventure.png" },
    { keywords: ["woven", "قش", "حرف"], image: "/sections/أدوات منزلية/Woven Straw Crafts Collection.png" },
    { keywords: ["carafe", "قارورة", "إبريق"], image: "/sections/أدوات منزلية/Elegant Arabic Carafe Kitchen Display.png" },
  ],
  bedding: [
    { keywords: ["pillow", "مخدة", "وسائد"], image: "/sections/الفرش المنزلي/Elegant Arabic Pillow Display.png" },
    { keywords: ["curtain", "ستائر"], image: "/sections/الفرش المنزلي/Elegant Curtain Boutique Showcase.png" },
    { keywords: ["doormat", "دعاسة", "مدخل"], image: "/sections/الفرش المنزلي/Elegant Doormat Display in Arabic.png" },
    { keywords: ["basket", "سلال", "مناديل"], image: "/sections/الفرش المنزلي/Elegant Woven Baskets and Tissue Display.png" },
    { keywords: ["blanket", "حرام", "بطانيات"], image: "/sections/الفرش المنزلي/أطقم حرامات ووسائد فاخرة.png" },
    { keywords: ["towel", "منشفة", "مناشف"], image: "/sections/الفرش المنزلي/بشاكير ومناشف بلمسة فاخرة.png" },
    { keywords: ["sheet", "شرشف", "رنر"], image: "/sections/الفرش المنزلي/شراشف ورنرات بلمسة فاخرة.png" },
  ],
  gifts: [
    { keywords: ["vase", "مزهرية", "فازة"], image: "/sections/تحف و هدايا/Elegant Arabic Vase Boutique Display.png" },
    { keywords: ["mirror", "مرآة", "مرايا"], image: "/sections/تحف و هدايا/Luxury Mirror Gallery Showroom.png" },
    { keywords: ["watch", "ساعة", "ساعات"], image: "/sections/تحف و هدايا/Luxury Watch Boutique Display.png" },
    { keywords: ["candle", "شمعدان", "شمعدانات"], image: "/sections/تحف و هدايا/شمعدانات فاخرة بإضاءة دافئة.png" },
    { keywords: ["painting", "لوحات", "براويز"], image: "/sections/تحف و هدايا/لوحات وبراويز بلمسة عربية دافئة.png" },
    { keywords: ["decor", "ديكور", "تحف"], image: "/sections/تحف و هدايا/تحف وديكورات فاخرة بإضاءة دافئة.png" },
  ],
};

const SUBCATEGORY_PARENT_SECTION: Record<string, keyof typeof SECTION_IMAGES> = {
  "أدوات كهربائية": "appliances",
  "Electrical appliances": "appliances",
  "أدوات مطبخ": "kitchenware",
  "أدوات المطبخ": "kitchenware",
  "Kitchen tools": "kitchenware",
  "أدوات منزلية": "kitchenwareArabic",
  Housewares: "kitchenwareArabic",
  "الفرش المنزلي": "bedding",
  "Home furnishings": "bedding",
  "تحف و هدايا": "gifts",
  "تحف وهدايا": "gifts",
  "Decor & gifts": "gifts",
  "ترتيب واستغلال المساحات": "organization",
  "Storage & organization": "organization",
  "دلات وضيافة": "hospitality",
  "دلالات وضيافة": "hospitality",
  "Coffee pots & hospitality": "hospitality",
};

function subcategoryImage(category: Category, parentCategory?: Category): string | undefined {
  if (!parentCategory) return undefined;
  const section = SUBCATEGORY_PARENT_SECTION[parentCategory.name.trim()]
    ?? STORE_CATEGORY_SECTION_IMAGES[parentCategory.slug]
    ?? CATEGORY_SECTION_IMAGES[parentCategory.slug];
  if (!section) return undefined;
  const name = `${category.name} ${category.slug}`.toLocaleLowerCase();
  return SUBCATEGORY_IMAGES[section]?.find(({ keywords }) =>
    keywords.some((keyword) => name.includes(keyword.toLocaleLowerCase())),
  )?.image;
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
    <AutoScrollRail label={translate(locale, "تصفح أقسام المتجر")} direction={localeDirection(locale)}>
      {cards}
    </AutoScrollRail>
  );
}
