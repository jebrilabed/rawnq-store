import { ProductCard } from "@/components/storefront/ProductCard";
import s from "@/components/storefront/storefront.module.css";
import { getProducts } from "@/lib/data/catalog";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ params, searchParams }: { params: { locale: string }; searchParams: { q?: string; category?: string } }) {
  const { locale } = params;
  const tr = (text: string) => translate(locale, text);
  const products = await getProducts({ q: searchParams.q?.trim(), category: searchParams.category, locale });
  return (
    <main className={`${s.wrap} ${s.section} ${s.compactPage}`}>
      <div className={s.head}><h1>{tr("جميع المنتجات")}</h1></div>
      <form action="" method="get" role="search">
        {searchParams.category && <input type="hidden" name="category" value={searchParams.category} />}
        <input className={s.input} name="q" type="search" defaultValue={searchParams.q} placeholder={tr("ابحث عن منتج")} aria-label={tr("بحث")} style={{ marginBottom: 16 }} />
      </form>
      {products.length === 0
        ? <p className={s.muted}>{tr("لا توجد منتجات مطابقة.")}</p>
        : <div className={s.grid}>{products.map((p) => <ProductCard key={p.id} product={p} locale={locale} />)}</div>}
    </main>
  );
}
