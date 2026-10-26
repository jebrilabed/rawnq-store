import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: [{ parentSlug: "asc" }, { slug: "asc" }]
  });

  function getAllFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const full = path.join(dir, file);
      if (fs.statSync(full).isDirectory()) {
        results = results.concat(getAllFiles(full));
      } else {
        results.push(full.replace(/^public/, "").replace(/\\/g, "/"));
      }
    }
    return results;
  }
  const path = await import("path");
  const allImages = getAllFiles("public/sections");
  console.log(`Total images in public/sections: ${allImages.length}`);
  
  // Let's create the intended complete mapping:
  const sectionImages = {
    bedding: "/sections/Luxury Home Bedding Collection.png", // الفرش المنزلي
    appliances: "/sections/Modern Kitchen Appliances Showcase.png", // أدوات كهربائية
    spices: "/sections/Indian Spice Market Still Life.png", // هندي
    cookware: "/sections/Luxury Gold-Accented Cookware Collection.png", // طناجر و قلايات
    organization: "/sections/Elegant Home Organization Display.png", // ترتيب واستغلال المساحات
    tableSetting: "/sections/Luxurious Gold-Accented Table Setting.png", // سفرة
    kitchenware: "/sections/Elegant Kitchenware Collection.png", // أدوات مطبخ
    hospitality: "/sections/WhatsApp Image 2026-10-22 at 6.50.39 PM.jpeg", // دلات وضيافة
    woodworks: "/sections/Rustic Wooden Kitchenware Collection.png", // خشبيات
    kitchenwareArabic: "/sections/Elegant Kitchenware Display with Arabic Sign.png", // أدوات منزلية
    glassware: "/sections/Luxury Glassware and Tea Sets Display.png", // زجاجيات و فناجين
    flowers: "/sections/Flowers and Trees_ Boutique Floral Showcase.png", // ورود و أشجار
    bathroom: "/sections/Elegant Marble Bathroom Accessories Display.png", // اكسسوارات حمام
    gifts: "/sections/Elegant Gifts and Décor Display.png", // تحف و هدايا
    homeDecor: "/sections/تحف و هدايا/تحف وديكورات فاخرة بإضاءة دافئة.png", // ديكورات منزل
    tongs: "/sections/Premium Kitchen Tongs Display.png", // طقاطيق
  };

  const rootMapping = {
    "category": sectionImages.bedding,
    "category-2": sectionImages.appliances,
    "category-3": sectionImages.spices,
    "category-4": sectionImages.cookware,
    "category-5": sectionImages.organization,
    "category-6": sectionImages.tableSetting,
    "category-7": sectionImages.kitchenware,
    "category-8": sectionImages.hospitality,
    "category-9": sectionImages.woodworks,
    "category-10": sectionImages.kitchenwareArabic,
    "category-11": sectionImages.glassware,
    "category-12": sectionImages.flowers,
    "category-13": sectionImages.bathroom,
    "category-14": sectionImages.gifts,
    "category-63": sectionImages.homeDecor, // ديكورات منزل
    "category-87": sectionImages.tongs, // طقاطيق
  };

  const subcategoryMapping = {
    // الفرش المنزلي (category)
    "category-15": "/sections/الفرش المنزلي/أطقم حرامات ووسائد فاخرة.png", // أطقم حرامات و وسائد
    "category-16": "/sections/الفرش المنزلي/Elegant Pillow Display with Arabic Sign.png", // مخدات
    "category-17": "/sections/الفرش المنزلي/بشاكير ومناشف بلمسة فاخرة.png", // بشاكير و مناشف
    "category-18": "/sections/الفرش المنزلي/Warm Entryway Doormat Showcase.png", // دعاسات
    "category-19": "/sections/الفرش المنزلي/شراشف ورنرات بلمسة فاخرة.png", // شراشف و رنرات
    "category-20": "/sections/الفرش المنزلي/Luxurious Baskets and Tissue Boxes Display.png", // سلات مع علب محارم
    "category-21": "/sections/الفرش المنزلي/Luxury Curtain Showroom with Arabic Sign.png", // برادي

    // أدوات كهربائية (category-2)
    "category-22": "/sections/أدوات كهربائية/Gemini_Generated_Image_h7fgkmh7fgkmh7fg.jpeg", // عصارات
    "category-23": "/sections/أدوات كهربائية/Gemini_Generated_Image_fvzun8fvzun8fvzu.jpeg", // خلاطات و مفارم
    "category-24": "/sections/أدوات كهربائية/Luxury Irons and Electric Skewers Display.png", // مكاوي و سشوارات
    "category-25": "/sections/أدوات كهربائية/Luxurious Kitchen Scales Display with Arabic Banner.png", // موازين
    "category-26": "/sections/أدوات كهربائية/مقالي هوائية_ نكهات ذهبية في مطبخ عصري.png", // مقالي هوائية
    "category-27": "/sections/أدوات كهربائية/Gemini_Generated_Image_5wz0sd5wz0sd5wz0.jpeg", // عجانات و خفاقات
    "category-28": "/sections/أدوات كهربائية/مكانس كهربائية في غرفة معيشة أنيقة.png", // مكانس كهرباء
    "category-29": "/sections/أدوات كهربائية/Premium Home Electronics Showcase.png", // كهربائيات مميزة
    "category-30": "/sections/أدوات كهربائية/Luxury Fan Showcase with Arabic Signage.png", // مراوح
    "category-31": "/sections/أدوات كهربائية/Warmly Staged Heater Collection.png", // صوبات

    // طناجر و قلايات (category-4)
    "category-32": "/sections/طناجر و قلايات/Premium Cookware Display with Arabic Sign.png", // قلايات
    "category-33": "/sections/طناجر و قلايات/Premium Oven Trays and Baked Delights.png", // صواني فرن

    // ترتيب واستغلال المساحات (category-5)
    "category-34": "/sections/ترتيب واستغلال المساحات/Gemini_Generated_Image_6b969r6b969r6b96.jpeg", // أطقم وعلب بهار
    "category-35": "/sections/ترتيب واستغلال المساحات/Gemini_Generated_Image_13vh2m13vh2m13vh.jpeg", // سلات ثلاجة
    "category-36": "/sections/ترتيب واستغلال المساحات/Gemini_Generated_Image_u6caq7u6caq7u6ca.jpeg", // علب بقوليات
    "category-37": "/sections/ترتيب واستغلال المساحات/Gemini_Generated_Image_hnuudohnuudohnuu.jpeg", // تبرويرات
    "category-38": "/sections/ترتيب واستغلال المساحات/منظمات معالق أنيقة في مطبخ دافئ.png", // منظمات معالق
    "category-39": "/sections/ترتيب واستغلال المساحات/منظمات قماش في أجواء منزلية دافئة.png", // منظمات قماش
    "category-40": "/sections/ترتيب واستغلال المساحات/Gemini_Generated_Image_ganex2ganex2gane.jpeg", // علاقات ملابس
    "category-41": "/sections/ترتيب واستغلال المساحات/Gemini_Generated_Image_dckgf7dckgf7dckg.jpeg", // رفوف جلي
    "category-42": "/sections/ترتيب واستغلال المساحات/Elegant Makeup Organizer Boutique Display.png", // منظمات ميك اب
    "category-43": "/sections/ترتيب واستغلال المساحات/منظمات منزلية متنوعة بأناقة دافئة.png", // منظمات منوعة

    // سفرة (category-6)
    "category-44": "/sections/زجاجيات و فناجين/Elegant Dishware Display with Arabic Signage.png", // صحون
    "category-45": "/sections/سفرة/Golden Copperware Showcase.png", // صحون نحاسية (ذهبية)
    "category-46": "/sections/سفرة/Luxurious Arabic Home Décor Showcase.png", // زخرف
    "category-47": "/sections/سفرة/Yogurt and Salad Kitchen Display.png", // زبادي وجاطات سلطة
    "category-48": "/sections/سفرة/Luxury Coaster Collection Display.png", // كوسترات

    // أدوات مطبخ (category-7)
    "category-49": "/sections/أدوات مطبخ/Luxury Cutlery and Knife Showcase.png", // سكاكين ومعالق
    "category-50": "/sections/أدوات مطبخ/Elegant Kitchen Utensils and Tongs Display.png", // مغارف وملاقط
    "category-51": "/sections/أدوات مطبخ/Premium Cutting Boards Kitchen Display.png", // قطاعات والواح تقطيع
    "category-52": "/sections/أدوات مطبخ/Elegant Kettles and Arabic Coffee Pots.png", // أباريق و غلايات
    "category-53": "/sections/أدوات مطبخ/Luxury Baking Tools and Desserts Display.png", // أدوات كيك وحلويات
    "category-54": "/sections/أدوات مطبخ/Warm Kitchen Spice Grinder Showcase.png", // مطاحن وممالح
    "category-55": "/sections/أدوات مطبخ/Cozy Modern Kitchen Accessories Display.png", // كماليات المطبخ
    "category-56": "/sections/أدوات مطبخ/Elegant Coffee Capsule Display.png", // ستاندات كبسولات
    "category-57": "/sections/أدوات مطبخ/مراييل مطبخ أنيقة ودفء منزلي.png", // مراييل مطبخ

    // تفريعات سكاكين ومعالق (category-49)
    "category-58": "/sections/أدوات مطبخ/Elegant Cutlery Kitchen Display.png", // معالق و شوك يومية
    "category-59": "/sections/أدوات مطبخ/Premium Original Knives Display.png", // سكاكين أصلية
    "category-60": "/sections/أدوات مطبخ/Premium Knife Set Store Display.png", // أطقم سكاكين

    // تفريعات مغارف وملاقط (category-50)
    "category-61": "/sections/أدوات مطبخ/Warm Wooden Utensil Kitchen Display.png", // مغارف خشب
    "category-62": "/sections/أدوات مطبخ/Elegant Stainless Steel Ladles in a Cozy Kitchen.png", // مغارف ستانليس

    // دلات وضيافة (category-8)
    "category-64": "/sections/دلات وضيافة/Gemini_Generated_Image_fw5lcpfw5lcpfw5l.jpeg", // صواني تقديم
    "category-65": "/sections/دلات وضيافة/Gemini_Generated_Image_a57gjra57gjra57g.jpeg", // متكات
    "category-66": "/sections/دلات وضيافة/Luxurious Arabic Coffee and Tea Display.png", // دلات قهوة وشاي
    "category-67": "/sections/دلات وضيافة/Gemini_Generated_Image_mt8etkmt8etkmt8e.jpeg", // مضايف
    "category-68": "/sections/دلات وضيافة/Gemini_Generated_Image_nksa0gnksa0gnksa.jpeg", // خرفان

    // أدوات منزلية (category-10)
    "category-69": "/sections/أدوات منزلية/Luxury Arabic Home Fragrance Display.png", // شموع ومباخر ومعطرات
    "category-70": "/sections/أدوات منزلية/Elegant Laundry Basket Display.png", // سلات غسيل
    "category-71": "/sections/أدوات منزلية/Modern Arabic Trash Bin Showroom Display.png", // سلات مهملات
    "category-72": "/sections/أدوات منزلية/Woven Straw Crafts Collection.png", // قش
    "category-73": "/sections/أدوات منزلية/Luxurious Tables Living Room Vignette.png", // طاولات
    "category-74": "/sections/أدوات منزلية/Elegant Storage Cabinet Showcase.png", // خزائن وجوارير
    "category-75": "/sections/أدوات منزلية/Elegant Home Laundry Essentials Display.png", // مناشر وطاولات كوي
    "category-76": "/sections/أدوات منزلية/Arabic Cleaning Supplies Display.png", // أدوات ومواد تنظيف
    "category-77": "/sections/أدوات منزلية/Elegant Tissue Box Collection.png", // علب محارم
    "category-78": "/sections/أدوات منزلية/Elegant Arabic Carafe Kitchen Display.png", // مطرات ولنش بوكس أو قناصل
    "category-79": "/sections/أدوات منزلية/Luxury Buffet Warmers in a Golden Kitchen.png", // حافظات سخن
    "category-80": "/sections/أدوات منزلية/Elegant Arabic Carafe Kitchen Display.png", // قناصل
    "category-81": "/sections/أدوات منزلية/Luxury Travel Coolers_ Adventure Awaits.png", // ثلاجات رحل

    // زجاجيات و فناجين (category-11)
    "category-82": "/sections/زجاجيات و فناجين/Elegant Glass Juice Dispensers Display.png", // شافات عصير
    "category-83": "/sections/زجاجيات و فناجين/Luxurious Glassware Showcase.png", // كاسات
    "category-84": "/sections/زجاجيات و فناجين/Luxurious Mug Collection Display.png", // مجات
    "category-85": "/sections/سفرة/Luxury Nuts and Fruit Serving Display.png", // صحون مكسرات وفواكه
    "category-86": "/sections/زجاجيات و فناجين/instruction-caption-high-level-instructi_tVwZQirBV8qHkYEV0vgmyQ_RqL__TshQAaxADaVczhOdA_cover.jpg", // أباريق زيت

    // ورود و أشجار (category-12)
    "category-88": "/sections/ورود و أشجار/Ornate Garden Planters Showcase.png", // قواوير

    // تحف و هدايا (category-14)
    "category-89": "/sections/تحف و هدايا/لوحات وبراويز بلمسة عربية دافئة.png", // لوحات وبراويز
    "category-90": "/sections/تحف و هدايا/Cozy Home Clock Display.png", // ساعات
    "category-91": "/sections/تحف و هدايا/Luxurious Mirror Display with Arabic Signage.png", // مرايا
    "category-92": "/sections/تحف و هدايا/شمعدانات فاخرة بإضاءة دافئة.png", // شمعدانات
    "category-93": "/sections/تحف و هدايا/تحف وديكورات فاخرة بإضاءة دافئة.png", // تحف وديكورات
    "category-94": "/sections/تحف و هدايا/Luxurious Vase Collection Display.png", // فازات
  };

  // Check every single category
  let missingCount = 0;
  for (const cat of categories) {
    let img = null;
    if (cat.parentSlug) {
      img = subcategoryMapping[cat.slug];
    } else {
      img = rootMapping[cat.slug];
    }

    if (!img) {
      console.log(`[MISSING MAPPING] ${cat.slug}: ${cat.name} (parent: ${cat.parentSlug})`);
      missingCount++;
    } else {
      const fullPath = "public" + img.replace(/\//g, "\\");
      if (!fs.existsSync(fullPath)) {
        console.log(`[FILE NOT FOUND] ${cat.slug}: ${cat.name} -> ${img}`);
        missingCount++;
      }
    }
  }

  console.log(`\nCheck finished. Missing or broken: ${missingCount} / ${categories.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
