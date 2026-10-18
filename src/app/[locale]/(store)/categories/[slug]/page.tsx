import { notFound } from "next/navigation";
import { ProductCard } from "@/components/storefront/ProductCard";
import s from "@/components/storefront/storefront.module.css";
import { getCategories, getProducts } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { locale: string; slug: string } }) {
  const category = (await getCategories()).find((c) => c.slug === params.slug);
  if (!category) notFound();
  const products = await getProducts({ category: category.slug });
  return (
    <main className={`${s.wrap} ${s.section}`}>
      <div className={s.head}><h1>{category.name}</h1></div>
      {products.length === 0
        ? <p className={s.muted}>لا توجد منتجات في هذا القسم بعد.</p>
        : <div className={s.grid}>{products.map((p) => <ProductCard key={p.id} product={p} locale={params.locale} />)}</div>}
    </main>
  );
}
