import { randomUUID } from "node:crypto";
import type { Product, Variant } from "@/lib/types";
import type { OrderStatus, OrderSummary } from "@/lib/orders";
import { db, type Content, type Settings } from "./db";

export const stockOf = (p: Product) => (p.variants.length ? p.variants.reduce((n, v) => n + v.stock, 0) : p.stock);

export function stats() {
  const t = db.settings.lowStockThreshold;
  return {
    products: db.products.length,
    orders: db.orders.length,
    low: db.products.filter((p) => stockOf(p) <= t).length,
    sales: db.orders.filter((o) => o.status !== "CANCELLED").reduce((n, o) => n + o.total, 0),
  };
}

const slugify = (s: string, fallback: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
const uniqueSlug = (base: string, taken: (s: string) => boolean) => { let s = base, n = 2; while (taken(s)) s = `${base}-${n++}`; return s; };

export type ProductInput = {
  id?: string; name: string; description: string; categorySlug: string; price: number; comparePrice?: number;
  stock: number; image: string; published: boolean; variants: Variant[];
};

export function saveProduct(i: ProductInput): string | null {
  if (i.name.length < 2) return "أدخل اسم المنتج.";
  if (!(i.price > 0)) return "أدخل سعراً صحيحاً.";
  if (!db.categories.some((c) => c.slug === i.categorySlug)) return "اختر قسماً. أضف قسماً من صفحة الأقسام أولاً.";
  if (!i.image.startsWith("/") && !i.image.startsWith("https://")) return "رابط الصورة غير صالح.";
  const existing = i.id ? db.products.find((p) => p.id === i.id) : undefined;
  if (existing) {
    Object.assign(existing, { name: i.name, description: i.description, categorySlug: i.categorySlug, price: i.price, comparePrice: i.comparePrice, stock: i.stock, image: i.image, published: i.published, variants: i.variants });
  } else {
    const slug = uniqueSlug(slugify(i.name, "product"), (s) => db.products.some((p) => p.slug === s));
    db.products.unshift({ id: randomUUID(), slug, name: i.name, description: i.description, categorySlug: i.categorySlug, price: i.price, comparePrice: i.comparePrice, stock: i.stock, image: i.image, published: i.published, variants: i.variants });
  }
  return null;
}
export const deleteProduct = (id: string) => { db.products = db.products.filter((p) => p.id !== id); };
export const togglePublished = (id: string) => { const p = db.products.find((x) => x.id === id); if (p) p.published = !p.published; };
export function setStock(id: string, variantIndex: number | null, qty: number) {
  const p = db.products.find((x) => x.id === id); if (!p || !Number.isInteger(qty) || qty < 0) return;
  if (variantIndex === null) p.stock = qty; else if (p.variants[variantIndex]) p.variants[variantIndex].stock = qty;
}

export function addCategory(name: string): string | null {
  if (name.length < 2) return "أدخل اسم القسم.";
  if (db.categories.some((c) => c.name === name)) return "القسم موجود مسبقاً.";
  db.categories.push({ slug: uniqueSlug(slugify(name, "category"), (s) => db.categories.some((c) => c.slug === s)), name });
  return null;
}
export function renameCategory(slug: string, name: string): string | null {
  if (name.length < 2) return "أدخل اسم القسم.";
  if (db.categories.some((c) => c.name === name && c.slug !== slug)) return "القسم موجود مسبقاً.";
  const c = db.categories.find((x) => x.slug === slug); if (c) c.name = name; return null;
}
export function deleteCategory(slug: string): string | null {
  if (db.products.some((p) => p.categorySlug === slug)) return "انقل منتجات القسم أولاً.";
  db.categories = db.categories.filter((c) => c.slug !== slug); return null;
}

export const getOrder = (n: string): OrderSummary | undefined => db.orders.find((o) => o.orderNumber === n);
export function setOrderStatus(n: string, status: OrderStatus) { const o = getOrder(n); if (o) o.status = status; }
export const saveSettings = (s: Settings) => { db.settings = s; };
export const saveContent = (c: Content) => { db.content = c; };

/** يُستدعى من placeOrder: يحفظ الطلب ويخصم المخزون. في Prisma: داخل نفس المعاملة. */
export function commitOrder(o: OrderSummary) {
  for (const i of o.items) {
    const p = db.products.find((x) => x.slug === i.slug); if (!p) continue;
    const v = p.variants.find((x) => [x.color, x.size].filter(Boolean).join(" / ") === (i.option ?? ""));
    if (v) v.stock = Math.max(0, v.stock - i.qty); else p.stock = Math.max(0, p.stock - i.qty);
  }
  db.orders.unshift(o);
}
