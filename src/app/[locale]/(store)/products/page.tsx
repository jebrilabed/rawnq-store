import { ProductCard } from "@/components/storefront/ProductCard";
import s from "@/components/storefront/storefront.module.css";
import { getProducts } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ params, searchParams }: { params: { locale: string }; searchParams: { q?: string; category?: string } }) {
  const products = await getProducts({ q: searchParams.q?.trim(), category: searchParams.category });
  return (
    <main className={`${s.wrap} ${s.section} ${s.compactPage}`}>
      <div className={s.head}><h1>جميع المنتجات</h1></div>
      <form action="" method="get" role="search">
        {searchParams.category && <input type="hidden" name="category" value={searchParams.category} />}
        <input className={s.input} name="q" type="search" defaultValue={searchParams.q} placeholder="ابحث عن منتج" aria-label="بحث" style={{ marginBottom: 16 }} />
      </form>
      {products.length === 0
        ? <p className={s.muted}>لا توجد منتجات مطابقة.</p>
        : <div className={s.grid}>{products.map((p) => <ProductCard key={p.id} product={p} locale={params.locale} />)}</div>}
    </main>
  );
}
