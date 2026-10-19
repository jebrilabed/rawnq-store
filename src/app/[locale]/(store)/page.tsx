import Image from "next/image";
import Link from "next/link";
import { Marquee } from "@/components/storefront/Marquee";
import { ProductCard } from "@/components/storefront/ProductCard";
import { CategoryRail } from "@/components/storefront/CategoryRail";
import { AutoScrollRail } from "@/components/storefront/AutoScrollRail";
import s from "@/components/storefront/storefront.module.css";
import { getBestSellingProducts, getCategories, getProducts } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [categories, products, bestSelling] = await Promise.all([
    getCategories(), getProducts(), getBestSellingProducts(5),
  ]);
  return (
    <main>
      <section className={s.banner}>
        <Image src="/brand/banner.jpg" alt="رونق ستور - كل ما يحتاجه بيتك بلمسة جمال وجودة" width={1200} height={670} priority sizes="100vw" />
      </section>
      <Marquee />
      <section className={s.railSection}>
        <div className={s.wrap}>
          <div className={s.railHeading}><div><span>اكتشف مجموعتنا</span><h2>تسوّق حسب القسم</h2></div><Link href={`/${locale}/products`}>كل المنتجات</Link></div>
          <CategoryRail categories={categories} locale={locale} />
        </div>
      </section>
      <section className={`${s.railSection} ${s.bestSellerSection}`}>
        <div className={s.wrap}>
          <div className={s.railHeading}><div><span>الأكثر طلبًا</span><h2>الأكثر مبيعًا</h2></div><Link href={`/${locale}/products`}>عرض الكل</Link></div>
          {bestSelling.length ? (
            <AutoScrollRail label="المنتجات الأكثر مبيعًا">
              {bestSelling.map((product) => (
                <div key={product.id} data-rail-item className={s.bestSellerCard}>
                  <ProductCard product={product} locale={locale} />
                </div>
              ))}
            </AutoScrollRail>
          ) : (
            <div className={s.bestSellerEmpty}>ستظهر هنا المنتجات الأكثر مبيعًا بعد تسجيل أول الطلبات.</div>
          )}
        </div>
      </section>
      <section className={`${s.wrap} ${s.section}`}>
        <div className={s.head}><h2>وصل حديثاً</h2><Link href={`/${locale}/products`}>عرض الكل</Link></div>
        <div className={s.grid}>{products.map((p) => <ProductCard key={p.id} product={p} locale={locale} />)}</div>
      </section>
    </main>
  );
}
