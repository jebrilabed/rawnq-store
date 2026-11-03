import type { Prisma } from "@prisma/client";
import type { Category, Product } from "@/lib/types";
import { randomInt } from "node:crypto";
import { prisma } from "./prisma";
import { localizedValue, translate } from "@/lib/i18n";

function toProduct(row: { id: string; slug: string; name: string; description: string; translations?: string | null; price: { toNumber(): number }; comparePrice: { toNumber(): number } | null; image: string; categorySlug: string; stock: number; published: boolean; variants?: { color: string | null; size: string | null; stock: number; price: { toNumber(): number } | null }[] }, locale = "ar"): Product {
  return {
    id: row.id, slug: row.slug,
    name: localizedValue(row.translations, locale, row.name),
    description: localizedProductDescription(row.translations, locale, row.description),
    translations: row.translations ?? undefined,
    price: row.price.toNumber(), comparePrice: row.comparePrice?.toNumber(), image: row.image,
    categorySlug: row.categorySlug, stock: row.stock, published: row.published,
    variants: (row.variants ?? []).map((variant) => ({ color: variant.color ?? undefined, size: variant.size ?? undefined, stock: variant.stock, price: variant.price?.toNumber() })),
  };
}

function localizedProductDescription(translations: string | null | undefined, locale: string, fallback: string): string {
  if (locale === "ar" || !translations) return fallback;
  try {
    const values: unknown = JSON.parse(translations);
    if (typeof values === "object" && values !== null) {
      const value = (values as Record<string, unknown>)[`${locale}_description`];
      if (typeof value === "string" && value.trim()) return value;
    }
  } catch (error) {
    console.error("Invalid product translations JSON.", error);
  }
  return translate(locale, fallback);
}

export async function getCategories(locale = "ar"): Promise<Category[]> {
  const categories = await prisma.category.findMany({ orderBy: [{ parentSlug: "asc" }, { name: "asc" }] });
  return categories.map((category) => ({
    slug: category.slug,
    name: localizedValue(category.translations, locale, category.name),
    parentSlug: category.parentSlug,
  }));
}

type ProductFilters = { category?: string; q?: string; locale?: string };

async function productWhere(opts: ProductFilters): Promise<Prisma.ProductWhereInput> {
  const searchFilters: Prisma.ProductWhereInput[] = [];
  let categorySlugs: string[] | undefined;
  if (opts.category) {
    const categories = await prisma.category.findMany({ select: { slug: true, parentSlug: true } });
    const descendants = new Set([opts.category]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const category of categories) {
        if (category.parentSlug && descendants.has(category.parentSlug) && !descendants.has(category.slug)) {
          descendants.add(category.slug);
          changed = true;
        }
      }
    }
    categorySlugs = [...descendants];
  }
  if (opts.q) {
    searchFilters.push({ name: { contains: opts.q, mode: "insensitive" } });
    if (opts.locale && opts.locale !== "ar") {
      searchFilters.push({ translations: { contains: opts.q, mode: "insensitive" } });
    }
  }

  return {
    published: true,
    ...(categorySlugs ? { categorySlug: { in: categorySlugs } } : {}),
    ...(searchFilters.length ? { OR: searchFilters } : {}),
  };
}

function productOrder(): Prisma.ProductOrderByWithRelationInput[] {
  return [{ createdAt: "desc" }, { id: "desc" }];
}

export async function getProducts(opts: ProductFilters & { take?: number; skip?: number } = {}): Promise<Product[]> {
  const where = await productWhere(opts);

  const rows = await prisma.product.findMany({
    where,
    ...(opts.take !== undefined ? { take: Math.max(0, Math.trunc(opts.take)) } : {}),
    ...(opts.skip !== undefined ? { skip: Math.max(0, Math.trunc(opts.skip)) } : {}),
    include: { variants: true }, orderBy: productOrder(),
  });
  return rows.map((row) => toProduct(row, opts.locale));
}

export async function getProductPage(opts: ProductFilters & { page: number; pageSize: number }) {
  const where = await productWhere(opts);
  const pageSize = Math.max(1, Math.min(100, Math.trunc(opts.pageSize)));
  const total = await prisma.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Math.trunc(opts.page) || 1), pageCount);
  const rows = await prisma.product.findMany({
    where,
    take: pageSize,
    skip: (page - 1) * pageSize,
    include: { variants: true },
    orderBy: productOrder(),
  });
  return { products: rows.map((row) => toProduct(row, opts.locale)), total, page, pageSize, pageCount };
}

export async function getBestSellingProducts(limit = 5, locale = "ar"): Promise<Product[]> {
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
  const rankedBySlug = new Map(rankedRows.map((row) => [row.slug, toProduct(row, locale)]));
  const products = ranked.flatMap((row) => {
    const product = rankedBySlug.get(row.slug);
    return product ? [product] : [];
  });
  const missing = target - products.length;
  if (missing <= 0) return products;

  const candidateWhere = { published: true, slug: { notIn: products.map((product) => product.slug) } };
  const candidateCount = await prisma.product.count({ where: candidateWhere });
  const maxStart = Math.max(0, candidateCount - missing);
  const start = maxStart > 0 ? randomInt(maxStart + 1) : 0;
  const randomRows = await prisma.product.findMany({
    where: candidateWhere,
    take: missing,
    skip: start,
    orderBy: productOrder(),
    include: { variants: true },
  });
  return [...products, ...randomRows.map((row) => toProduct(row, locale))].slice(0, target);
}

export async function getProduct(slug: string, locale = "ar"): Promise<Product | null> {
  const row = await prisma.product.findFirst({ where: { slug, published: true }, include: { variants: true } });
  return row ? toProduct(row, locale) : null;
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  return row ? toProduct(row) : null;
}
