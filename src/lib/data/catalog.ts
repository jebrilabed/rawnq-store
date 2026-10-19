import type { Category, Product } from "@/lib/types";
import { randomInt } from "node:crypto";
import { prisma } from "./prisma";

function toProduct(row: { id: string; slug: string; name: string; description: string; price: { toNumber(): number }; comparePrice: { toNumber(): number } | null; image: string; categorySlug: string; stock: number; published: boolean; variants: { color: string | null; size: string | null; stock: number; price: { toNumber(): number } | null }[] }): Product {
  return {
    id: row.id, slug: row.slug, name: row.name, description: row.description,
    price: row.price.toNumber(), comparePrice: row.comparePrice?.toNumber(), image: row.image,
    categorySlug: row.categorySlug, stock: row.stock, published: row.published,
    variants: row.variants.map((variant) => ({ color: variant.color ?? undefined, size: variant.size ?? undefined, stock: variant.stock, price: variant.price?.toNumber() })),
  };
}

export async function getCategories(): Promise<Category[]> {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getProducts(opts: { category?: string; q?: string } = {}): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { published: true, ...(opts.category ? { categorySlug: opts.category } : {}), ...(opts.q ? { name: { contains: opts.q, mode: "insensitive" } } : {}) },
    include: { variants: true }, orderBy: { createdAt: "desc" },
  });
  return rows.map(toProduct);
}

export async function getBestSellingProducts(limit = 5): Promise<Product[]> {
  const target = Math.max(1, Math.min(24, Math.trunc(limit)));
  const ranked = await prisma.orderItem.groupBy({
    by: ["slug"],
    where: { order: { is: { status: { not: "CANCELLED" } } } },
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take: target,
  });
  const rankedRows = ranked.length ? await prisma.product.findMany({
    where: { slug: { in: ranked.map((row) => row.slug) }, published: true },
    include: { variants: true },
  }) : [];
  const rankedBySlug = new Map(rankedRows.map((row) => [row.slug, toProduct(row)]));
  const products = ranked.flatMap((row) => {
    const product = rankedBySlug.get(row.slug);
    return product ? [product] : [];
  });
  const missing = target - products.length;
  if (missing <= 0) return products;

  const candidates = await prisma.product.findMany({
    where: { published: true, slug: { notIn: products.map((product) => product.slug) } },
    select: { slug: true },
  });
  for (let index = candidates.length - 1; index > 0; index--) {
    const otherIndex = randomInt(index + 1);
    [candidates[index], candidates[otherIndex]] = [candidates[otherIndex], candidates[index]];
  }
  const randomSlugs = candidates.slice(0, missing).map((candidate) => candidate.slug);
  if (!randomSlugs.length) return products;
  const randomRows = await prisma.product.findMany({
    where: { slug: { in: randomSlugs }, published: true }, include: { variants: true },
  });
  const randomBySlug = new Map(randomRows.map((row) => [row.slug, toProduct(row)]));
  return [...products, ...randomSlugs.flatMap((slug) => {
    const product = randomBySlug.get(slug);
    return product ? [product] : [];
  })].slice(0, target);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const row = await prisma.product.findFirst({ where: { slug, published: true }, include: { variants: true } });
  return row ? toProduct(row) : null;
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  return row ? toProduct(row) : null;
}
