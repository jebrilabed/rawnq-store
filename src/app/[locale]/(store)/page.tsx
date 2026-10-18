import Image from "next/image";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Marquee } from "@/components/storefront/Marquee";
import { ProductCard } from "@/components/storefront/ProductCard";
import s from "@/components/storefront/storefront.module.css";
import { getCategories, getProducts } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return (
    <main>
      <section className={s.banner}>
        <Image src="/brand/banner.jpg" alt="رونق ستور - كل ما يحتاجه بيتك بلمسة جمال وجودة" width={1200} height={670} priority sizes="100vw" />
      </section>
      <Marquee />
      <nav className={s.cats} aria-label="الأقسام">
        {categories.map((c) => (
          <Link key={c.slug} className={s.cat} href={`/${locale}/products?category=${c.slug}`}>
            <i><LayoutGrid size={28} strokeWidth={1.6} /></i>{c.name}
          </Link>
        ))}
      </nav>
      <section className={`${s.wrap} ${s.section}`}>
        <div className={s.head}><h2>وصل حديثاً</h2><Link href={`/${locale}/products`}>عرض الكل</Link></div>
        <div className={s.grid}>{products.map((p) => <ProductCard key={p.id} product={p} locale={locale} />)}</div>
      </section>
    </main>
  );
}
