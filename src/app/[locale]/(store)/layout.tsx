import { auth } from "@/auth";
import { CartProvider } from "@/components/storefront/CartProvider";
import { Footer } from "@/components/storefront/Footer";
import { FavoritesProvider } from "@/components/storefront/FavoritesProvider";
import { Header } from "@/components/storefront/Header";
import { getFavoriteProductIds } from "@/lib/data/favorites";
import { getSettings } from "@/lib/data/db";
import s from "@/components/storefront/storefront.module.css";

export default async function StoreLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const session = await auth();
  const customerUserId = session?.user?.role === "CUSTOMER" ? session.user.id : undefined;
  const [initialIds, settings] = await Promise.all([
    customerUserId ? getFavoriteProductIds(customerUserId) : Promise.resolve([]),
    getSettings(),
  ]);
  return (
    <CartProvider>
      <FavoritesProvider key={customerUserId ?? "guest"} initialIds={initialIds} authenticated={Boolean(customerUserId)}>
        <div className={s.storeShell}>
          <Header locale={params.locale} storeName={settings.storeName} />
          <div className={s.storeMain}>{children}</div>
          <Footer locale={params.locale} />
        </div>
      </FavoritesProvider>
    </CartProvider>
  );
}
