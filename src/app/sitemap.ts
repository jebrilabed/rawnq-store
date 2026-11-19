import type { MetadataRoute } from "next";
import { prisma } from "@/lib/data/prisma";
import { LOCALES } from "@/lib/i18n";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://rawnq.ps").replace(/\/$/, "");

  // Fetch all published products and all categories
  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string }[] = [];

  try {
    [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        select: { slug: true },
      }),
    ]);
  } catch (error) {
    console.error("Failed to generate sitemap data:", error);
  }

  const entries: MetadataRoute.Sitemap = [];

  // Home and static pages for each locale
  for (const locale of LOCALES) {
    entries.push(
      {
        url: `${baseUrl}/${locale}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/${locale}/products`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/${locale}/categories`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }
    );

    // Products
    for (const product of products) {
      entries.push({
        url: `${baseUrl}/${locale}/products/${encodeURIComponent(product.slug)}`,
        lastModified: product.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    // Categories
    for (const category of categories) {
      entries.push({
        url: `${baseUrl}/${locale}/categories/${encodeURIComponent(category.slug)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
