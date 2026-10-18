import type { Category, Product } from "@/lib/types";
import { db } from "./db";

/** واجهة المتجر العامة: المنتجات المنشورة فقط. استبدل بـ Prisma (status = PUBLISHED). */
export async function getCategories(): Promise<Category[]> { return db.categories; }

export async function getProducts(opts: { category?: string; q?: string } = {}): Promise<Product[]> {
  return db.products.filter((p) => p.published && (!opts.category || p.categorySlug === opts.category) && (!opts.q || p.name.includes(opts.q)));
}

export async function getProduct(slug: string): Promise<Product | null> {
  return db.products.find((p) => p.slug === slug && p.published) ?? null;
}
