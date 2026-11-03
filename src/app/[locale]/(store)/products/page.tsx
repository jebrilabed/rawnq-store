import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductSearch } from "@/components/storefront/ProductSearch";
import s from "@/components/storefront/storefront.module.css";
import Link from "next/link";
import { getProductPage } from "@/lib/data/catalog";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ params, searchParams }: { params: { locale: string }; searchParams: { q?: string; category?: string; page?: string } }) {
  const { locale } = params;
  const tr = (text: string) => translate(locale, text);
  const query = searchParams.q?.trim();
  const category = searchParams.category?.trim();
  const rawPage = Number(searchParams.page);
  const requestedPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const { products, page, pageCount } = await getProductPage({ q: query, category, locale, page: requestedPage, pageSize: 20 });
  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (targetPage > 1) params.set("page", String(targetPage));
    const search = params.toString();
    return `/${locale}/products${search ? `?${search}` : ""}`;
  };
  const firstPage = Math.max(1, Math.min(pageCount - 4, page - 2));
  const visiblePages = Array.from({ length: Math.min(pageCount, 5) }, (_, index) => firstPage + index);
  return (
    <main className={`${s.wrap} ${s.section} ${s.compactPage}`}>
      <div className={s.head}><h1>{tr("جميع المنتجات")}</h1></div>
      <div className={s.searchPageField}>
        <ProductSearch locale={locale} value={searchParams.q} category={searchParams.category} />
      </div>
      {products.length === 0
        ? <p className={s.muted}>{tr("لا توجد منتجات مطابقة.")}</p>
        : <div className={s.grid}>{products.map((p) => <ProductCard key={p.id} product={p} locale={locale} />)}</div>}
      {pageCount > 1 && (
        <nav className={s.pagination} aria-label={tr("صفحات المنتجات")}>
          {page > 1 ? <Link prefetch={false} className={s.paginationLink} href={pageHref(page - 1)}>{tr("السابق")}</Link> : <span className={s.paginationDisabled}>{tr("السابق")}</span>}
          <div className={s.paginationPages}>
            {visiblePages.map((pageNumber) => (
              <Link
                key={pageNumber}
                prefetch={false}
                className={`${s.paginationLink} ${pageNumber === page ? s.paginationCurrent : ""}`}
                href={pageHref(pageNumber)}
                aria-current={pageNumber === page ? "page" : undefined}
                aria-label={`${tr("الصفحة")} ${pageNumber}`}
              >
                {pageNumber}
              </Link>
            ))}
          </div>
          {page < pageCount ? <Link prefetch={false} className={s.paginationLink} href={pageHref(page + 1)}>{tr("التالي")}</Link> : <span className={s.paginationDisabled}>{tr("التالي")}</span>}
        </nav>
      )}
    </main>
  );
}
