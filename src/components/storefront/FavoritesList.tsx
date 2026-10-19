"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { useFavorites } from "./FavoritesProvider";
import s from "./storefront.module.css";

export function FavoritesList({ products, locale }: { products: Product[]; locale: string }) {
  const { ids } = useFavorites();
  const favorites = products.filter((product) => ids.includes(product.id));

  if (!favorites.length) {
    return (
      <div className={s.favoritesEmpty}>
        <span className={s.emptyIcon}><Heart size={28} strokeWidth={1.5} aria-hidden="true" /></span>
        <h2>لا توجد منتجات محفوظة</h2>
        <p>احتفظ بالمنتجات التي أعجبتك وارجع إليها وقتما تشاء.</p>
        <Link href={`/${locale}/products`} className={s.btn}>تصفح المنتجات</Link>
      </div>
    );
  }

  return (
    <>
      <div className={s.collectionMeta}><span>{favorites.length} {favorites.length === 1 ? "منتج محفوظ" : "منتجات محفوظة"}</span><p>منتجات اخترتها للعودة إليها لاحقًا</p></div>
      <div className={s.grid}>{favorites.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}</div>
    </>
  );
}
