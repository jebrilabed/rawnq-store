import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const categories = [
  { slug: "kitchen", name: "أدوات المطبخ" },
  { slug: "storage", name: "التخزين" },
  { slug: "bathroom", name: "الحمام" },
  { slug: "dining", name: "السفرة والضيافة" },
  { slug: "bedroom", name: "غرفة النوم" },
  { slug: "living-room", name: "غرفة المعيشة" },
  { slug: "decor", name: "الديكور" },
  { slug: "lighting", name: "الإضاءة" },
  { slug: "cleaning", name: "التنظيف والعناية بالمنزل" },
  { slug: "laundry", name: "الغسيل والكي" },
  { slug: "textiles", name: "المفروشات والمنسوجات" },
  { slug: "furniture", name: "الأثاث المنزلي" },
  { slug: "appliances", name: "الأجهزة المنزلية" },
  { slug: "garden", name: "الحديقة والشرفة" },
];
const products = [
  { slug: "gold-vacuum-jug-1l", name: "إبريق فاكيوم ذهبي 1 لتر", description: "إبريق حافظ للحرارة بتصميم مزخرف.", price: 45, comparePrice: 59, image: "/products/jug.jpg", categorySlug: "kitchen", stock: 24 },
  { slug: "luxury-serving-set", name: "طقم تقديم فاخر", description: "أطقم تقديم للضيافة والمناسبات.", price: 129, comparePrice: 159, image: "/products/dishes.jpg", categorySlug: "kitchen", stock: 8 },
  { slug: "fabric-storage-baskets", name: "سلال تخزين قماشية", description: "سلال بتصميم عصري توفر المساحة.", price: 39, image: "/products/baskets.jpg", categorySlug: "storage", stock: 0, variants: [{ color: "رمادي", stock: 1 }, { color: "بيج", stock: 1 }, { color: "أبيض", stock: 1 }] },
  { slug: "juice-glass-set-12", name: "طقم كاسات عصير 12 قطعة", description: "كاسات زجاج مناسبة لجميع المناسبات.", price: 35, comparePrice: 45, image: "/products/glasses.jpg", categorySlug: "kitchen", stock: 40 },
  { slug: "bathroom-accessories-set", name: "طقم إكسسوارات حمام", description: "طقم متكامل لإكسسوارات الحمام.", price: 79, comparePrice: 99, image: "/products/bath.jpg", categorySlug: "bathroom", stock: 0, variants: [{ color: "بيج", stock: 3 }, { color: "أبيض", stock: 3 }] },
];

try {
  for (const category of categories) {
    await prisma.category.upsert({ where: { slug: category.slug }, create: category, update: {} });
  }
  for (const product of products) {
    const { variants = [], ...data } = product;
    await prisma.product.upsert({
      where: { slug: product.slug },
      create: { ...data, variants: { create: variants } },
      update: {},
    });
  }
  await prisma.storeSettings.upsert({ where: { id: 1 }, create: { id: 1, storeName: "RAWNQ Home & Living", phone: "+972 569836183", instagram: "rawna.qstore26", shippingFee: 20, cod: true, bank: true }, update: {} });
  await prisma.storeContent.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      about: "رونق Home & Living متجر للأدوات المنزلية والتخزين والديكور. نختار منتجاتنا بعناية لتمنح بيتك لمسة جمال وجودة.",
      delivery: "نوصّل لجميع المحافظات، ويتم تأكيد موعد التوصيل هاتفياً بعد الطلب. تُحدد شروط الاستبدال والاسترجاع من إدارة المتجر.",
      faq: [["كيف أطلب؟", "أضف المنتجات إلى السلة ثم أكمل الطلب بإدخال بيانات التوصيل."], ["ما طرق الدفع؟", "الدفع عند الاستلام أو التحويل البنكي."], ["كم مدة التوصيل؟", "يتم تأكيد الموعد معك هاتفياً بعد الطلب."]],
    }, update: {},
  });
  console.log("Store data is ready.");
} finally {
  await prisma.$disconnect();
}