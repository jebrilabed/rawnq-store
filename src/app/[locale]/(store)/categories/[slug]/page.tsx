import { notFound } from "next/navigation";
import { ProductCard } from "@/components/storefront/ProductCard";
import s from "@/components/storefront/storefront.module.css";
import { getCategories, getProducts } from "@/lib/data/catalog";
import { translate } from "@/lib/i18n";
import { CategoryRail } from "@/components/storefront/CategoryRail";
import { ProductSearch } from "@/components/storefront/ProductSearch";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params, searchParams }: { params: { locale: string; slug: string }; searchParams: { q?: string } }) {
  const categories = await getCategories(params.locale);
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) notFound();
  const children = categories.filter((item) => item.parentSlug === category.slug);
  const query = searchParams.q?.trim();
  const products = await getProducts({ category: category.slug, q: query, locale: params.locale });
  const tr = (text: string) => translate(params.locale, text);
  return (
    <main>
      {children.length > 0 && (
        <section className={s.railSection}>
          <CategoryRail categories={children} locale={params.locale} parentCategory={category} />
        </section>
      )}
      <div className={`${s.wrap} ${s.section}`}>
        <div className={s.head}><h1>{category.name}</h1></div>
        <div className={s.searchPageField}>
          <ProductSearch locale={params.locale} value={query} category={category.slug} />
        </div>
        {products.length > 0
          ? <div className={s.grid}>{products.map((p) => <ProductCard key={p.id} product={p} locale={params.locale} />)}</div>
          : query
            ? <p className={s.muted}>{tr("لا توجد منتجات مطابقة.")}</p>
            : children.length === 0 && <p className={s.muted}>{tr("لا توجد منتجات في هذا القسم بعد.")}</p>}
      </div>
    </main>
  );
}
