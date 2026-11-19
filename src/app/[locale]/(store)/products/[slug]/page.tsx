import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { FavoriteButton } from "@/components/storefront/FavoriteButton";
import { VariantPicker } from "@/components/storefront/VariantPicker";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductViewTracker } from "@/components/analytics/ProductViewTracker";
import s from "@/components/storefront/storefront.module.css";
import { getProduct, getRelatedProducts } from "@/lib/data/catalog";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: { locale: string; slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct(params.slug, params.locale);
  if (!p) return { title: "RAWNQ" };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rawnq.ps";
  return {
    title: `${p.name} | RAWNQ`,
    description: p.description?.slice(0, 160) || p.name,
    openGraph: {
      title: `${p.name} | RAWNQ`,
      description: p.description?.slice(0, 160) || p.name,
      images: p.image ? [{ url: p.image }] : [],
      url: `${siteUrl}/${params.locale}/products/${p.slug}`,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug, params.locale);
  if (!product) notFound();

  const tr = (text: string) => translate(params.locale, text);
  const related = await getRelatedProducts(product.slug, product.categorySlug, params.locale, 4);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rawnq.ps";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: product.image,
    offers: {
      "@type": "Offer",
      priceCurrency: "ILS",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteUrl}/${params.locale}/products/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className={s.wrap}>
        <div className={s.detail}>
          <ProductViewTracker
            id={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            categoryName={product.categorySlug}
          />
          <div className={s.detailImg}>
            <Image src={product.image} alt={product.name} fill priority sizes="(min-width:720px) 50vw, 100vw" />
          </div>
          <div className={s.panel}>
            <Link href={`/${params.locale}/products`} className={s.muted}>← {tr("كل المنتجات")}</Link>
            <h1>{product.name}</h1>
            <div className={s.favoriteDetail}>
              <FavoriteButton productId={product.id} productName={product.name} locale={params.locale} />
              <span>{tr("أضف إلى المفضلة")}</span>
            </div>
            <p className={s.muted}>{product.description}</p>
            <VariantPicker product={product} locale={params.locale} />

            {/* Trust Badges */}
            <div className={s.trustBadges}>
              <div className={s.trustBadgeItem}>
                <Truck size={17} />
                <span>{tr("توصيل سريع لكافة المناطق")}</span>
              </div>
              <div className={s.trustBadgeItem}>
                <CheckCircle2 size={17} />
                <span>{tr("الدفع عند الاستلام")}</span>
              </div>
              <div className={s.trustBadgeItem}>
                <ShieldCheck size={17} />
                <span>{tr("معاينة المنتج قبل الدفع")}</span>
              </div>
              <div className={s.trustBadgeItem}>
                <RotateCcw size={17} />
                <span>{tr("استبدال واسترجاع سهل")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {related.length > 0 && (
          <section className={s.relatedWrap}>
            <div className={s.head}>
              <h2>{tr("منتجات قد تعجبك")}</h2>
              <Link href={`/${params.locale}/categories/${product.categorySlug}`}>{tr("عرض المزيد")}</Link>
            </div>
            <div className={s.grid}>
              {related.map((p) => (
                <ProductCard key={p.id} product={p} locale={params.locale} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
