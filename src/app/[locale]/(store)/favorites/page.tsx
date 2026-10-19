import { FavoritesList } from "@/components/storefront/FavoritesList";
import s from "@/components/storefront/storefront.module.css";
import { getProducts } from "@/lib/data/catalog";

export default async function FavoritesPage({ params }: { params: { locale: string } }) {
  const products = await getProducts();
  return (
    <main className={`${s.wrap} ${s.section} ${s.compactPage}`}>
      <div className={s.head}><h1>المفضلة</h1></div>
      <FavoritesList products={products} locale={params.locale} />
    </main>
  );
}
