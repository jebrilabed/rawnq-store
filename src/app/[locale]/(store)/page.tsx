import Image from "next/image";
import Link from "next/link";
import { Marquee } from "@/components/storefront/Marquee";
import { ProductCard } from "@/components/storefront/ProductCard";
import { CategoryRail } from "@/components/storefront/CategoryRail";
import { AutoScrollRail } from "@/components/storefront/AutoScrollRail";
import s from "@/components/storefront/storefront.module.css";
import { getBestSellingProducts, getCategories, getProducts } from "@/lib/data/catalog";
import { localeDirection, translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [categories, products, bestSelling] = await Promise.all([
    getCategories(locale), getProducts({ locale }), getBestSellingProducts(5, locale),
  ]);
  const tr = (text: string) => translate(locale, text);
  return (
    <main>
      <section className={s.banner}>
        <Image src="/brand/banner.jpg" alt={tr("رونق ستور - كل ما يحتاجه بيتك بلمسة جمال وجودة")} width={1200} height={670} priority sizes="100vw" />
      </section>
      <Marquee locale={locale} />
      <section className={s.railSection}>
        <div className={s.wrap}>
          <div className={s.railHeading}><div><span>{tr("اكتشف مجموعتنا")}</span><h2>{tr("تسوّق حسب القسم")}</h2></div><Link href={`/${locale}/products`}>{tr("كل المنتجات")}</Link></div>
          <CategoryRail categories={categories} locale={locale} />
        </div>
      </section>
      <section className={`${s.railSection} ${s.bestSellerSection}`}>
        <div className={s.wrap}>
          <div className={s.railHeading}><div><span>{tr("الأكثر طلبًا")}</span><h2>{tr("الأكثر مبيعًا")}</h2></div><Link href={`/${locale}/products`}>{tr("عرض الكل")}</Link></div>
          {bestSelling.length ? (
            <AutoScrollRail label={`${tr("المنتجات")} · ${tr("الأكثر مبيعًا")}`} direction={localeDirection(locale)}>
              {bestSelling.map((product) => (
                <div key={product.id} data-rail-item className={s.bestSellerCard}>
                  <ProductCard product={product} locale={locale} />
                </div>
              ))}
            </AutoScrollRail>
          ) : (
            <div className={s.bestSellerEmpty}>{tr("ستظهر هنا المنتجات الأكثر مبيعًا بعد تسجيل أول الطلبات.")}</div>
          )}
        </div>
      </section>
      <section className={`${s.wrap} ${s.section}`}>
        <div className={s.head}><h2>{tr("وصل حديثاً")}</h2><Link href={`/${locale}/products`}>{tr("عرض الكل")}</Link></div>
        <div className={s.grid}>{products.map((p) => <ProductCard key={p.id} product={p} locale={locale} />)}</div>
      </section>
    </main>
  );
}
