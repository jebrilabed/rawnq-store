"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { useFavorites } from "./FavoritesProvider";
import s from "./storefront.module.css";
import { translate } from "@/lib/i18n";

export function FavoritesList({ products, locale }: { products: Product[]; locale: string }) {
  const tr = (text: string) => translate(locale, text);
  const { ids } = useFavorites();
  const favorites = products.filter((product) => ids.includes(product.id));

  if (!favorites.length) {
    return (
      <div className={s.favoritesEmpty}>
        <span className={s.emptyIcon}><Heart size={28} strokeWidth={1.5} aria-hidden="true" /></span>
        <h2>{tr("لا توجد منتجات محفوظة")}</h2>
        <p>{tr("احتفظ بالمنتجات التي أعجبتك وارجع إليها وقتما تشاء.")}</p>
        <Link href={`/${locale}/products`} className={s.btn}>{tr("تصفح المنتجات")}</Link>
      </div>
    );
  }

  return (
    <>
      <div className={s.collectionMeta}><span>{favorites.length} {tr(favorites.length === 1 ? "منتج محفوظ" : "منتجات محفوظة")}</span><p>{tr("منتجات اخترتها للعودة إليها لاحقًا")}</p></div>
      <div className={s.grid}>{favorites.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}</div>
    </>
  );
}
