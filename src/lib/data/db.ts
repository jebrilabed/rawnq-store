import type { Category, Product } from "@/lib/types";
import { SHIPPING_FEE, STORE } from "@/lib/config";
import type { OrderItem, OrderStatus, OrderSummary } from "@/lib/orders";
import { FAQ, PAGES } from "./content";

export type Settings = {
  storeName: string; phone: string; whatsapp: string; instagram: string;
  shippingFee: number; freeShippingFrom: number | null;
  cod: boolean; bank: boolean; bankDetails: string; lowStockThreshold: number;
};
export type Content = { about: string; delivery: string; faq: [string, string][] };
type DB = { products: Product[]; categories: Category[]; orders: OrderSummary[]; settings: Settings; content: Content };

/**
 * قاعدة بيانات تجريبية في الذاكرة (تبقى أثناء التطوير فقط).
 * استبدل db.ts و admin.ts و catalog.ts باستعلامات Prisma مع الحفاظ على نفس الأشكال.
 */
function seed(): DB {
  const p = (id: string, slug: string, name: string, description: string, price: number, comparePrice: number | undefined, image: string, categorySlug: string, stock: number, variants: Product["variants"] = []): Product =>
    ({ id, slug, name, description, price, comparePrice, image, categorySlug, stock, variants, published: true });
  const products = [
    p("1", "gold-vacuum-jug-1l", "إبريق فاكيوم ذهبي 1 لتر", "إبريق حافظ للحرارة بتصميم مزخرف.", 45, 59, "/products/jug.jpg", "kitchen", 24),
    p("2", "luxury-serving-set", "طقم تقديم فاخر", "أطقم تقديم للضيافة والمناسبات.", 129, 159, "/products/dishes.jpg", "kitchen", 8),
    p("3", "fabric-storage-baskets", "سلال تخزين قماشية", "سلال بتصميم عصري توفر المساحة.", 39, undefined, "/products/baskets.jpg", "storage", 0, [{ color: "رمادي", stock: 1 }, { color: "بيج", stock: 1 }, { color: "أبيض", stock: 1 }]),
    p("4", "juice-glass-set-12", "طقم كاسات عصير 12 قطعة", "كاسات زجاج مناسبة لجميع المناسبات.", 35, 45, "/products/glasses.jpg", "kitchen", 40),
    p("5", "bathroom-accessories-set", "طقم إكسسوارات حمام", "طقم متكامل لإكسسوارات الحمام.", 79, 99, "/products/bath.jpg", "bathroom", 0, [{ color: "بيج", stock: 3 }, { color: "أبيض", stock: 3 }]),
  ];
  const line = (slug: string, qty: number, option?: string): OrderItem => {
    const pr = products.find((x) => x.slug === slug)!;
    return { slug, name: pr.name, image: pr.image, option, qty, unitPrice: pr.price };
  };
  const order = (n: string, status: OrderStatus, name: string, phone: string, city: string, address: string, payment: "cod" | "bank", items: OrderItem[], createdAt: string): OrderSummary => {
    const subtotal = items.reduce((t, i) => t + i.qty * i.unitPrice, 0);
    return { orderNumber: n, createdAt, status, customer: { name, phone, city, address }, payment, items, subtotal, shipping: SHIPPING_FEE, total: subtotal + SHIPPING_FEE };
  };
  return {
    products,
    categories: [{ slug: "kitchen", name: "أدوات المطبخ" }, { slug: "storage", name: "التخزين" }, { slug: "bathroom", name: "الحمام" }],
    orders: [
      order("RQ-482913", "NEW", "أحمد س.", "0599 000 111", "نابلس", "رفيديا، شارع الجامعة", "cod", [line("gold-vacuum-jug-1l", 1), line("fabric-storage-baskets", 1, "رمادي")], "2026-10-16T10:42:00Z"),
      order("RQ-482877", "PROCESSING", "سارة م.", "0568 000 222", "رام الله", "الماصيون، قرب البنك", "bank", [line("bathroom-accessories-set", 1, "بيج")], "2026-10-16T09:15:00Z"),
      order("RQ-482801", "SHIPPED", "محمد ع.", "0598 000 333", "جنين", "وسط البلد", "cod", [line("luxury-serving-set", 1), line("gold-vacuum-jug-1l", 1)], "2026-10-15T17:30:00Z"),
      order("RQ-482744", "DONE", "ليلى ك.", "0569 000 444", "طولكرم", "شارع نابلس", "bank", [line("juice-glass-set-12", 1)], "2026-10-14T13:05:00Z"),
    ],
    settings: { storeName: STORE.name, phone: STORE.phone, whatsapp: "", instagram: STORE.instagram, shippingFee: SHIPPING_FEE, freeShippingFrom: null, cod: true, bank: true, bankDetails: "", lowStockThreshold: 5 },
    content: { about: PAGES.about.body, delivery: PAGES.delivery.body, faq: FAQ.map(([q, a]) => [q, a] as [string, string]) },
  };
}

const g = globalThis as unknown as { __rawnqDb?: DB };
export const db: DB = (g.__rawnqDb ??= seed());
