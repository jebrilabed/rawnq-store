import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://rawnq.ps").replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/*",
        "/api/*",
        "/*/checkout",
        "/*/profile",
        "/*/orders",
        "/*/order-confirmation",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
