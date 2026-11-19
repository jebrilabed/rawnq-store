import { auth } from "@/auth";
import { CartProvider } from "@/components/storefront/CartProvider";
import { Footer } from "@/components/storefront/Footer";
import { FavoritesProvider } from "@/components/storefront/FavoritesProvider";
import { Header } from "@/components/storefront/Header";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { CookieConsent } from "@/components/storefront/CookieConsent";
import { FloatingWhatsApp } from "@/components/storefront/FloatingWhatsApp";
import { getFavoriteProductIds } from "@/lib/data/favorites";
import { getSettings } from "@/lib/data/db";
import { getCategories } from "@/lib/data/catalog";
import s from "@/components/storefront/storefront.module.css";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export default async function StoreLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const session = await auth();
  const customerUserId = session?.user?.role === "CUSTOMER" ? session.user.id : undefined;
  const [initialIds, settings, categories] = await Promise.all([
    customerUserId ? getFavoriteProductIds(customerUserId) : Promise.resolve([]),
    getSettings(),
    getCategories(params.locale),
  ]);
  return (
    <CartProvider>
      <FavoritesProvider key={customerUserId ?? "guest"} initialIds={initialIds} authenticated={Boolean(customerUserId)}>
        <MetaPixel />
        <div className={s.storeShell}>
          <Header locale={params.locale} storeName={settings.storeName} userRole={session?.user?.role} categories={categories} />
          <div className={s.storeMain}>{children}</div>
          <Footer locale={params.locale} userRole={session?.user?.role} />
        </div>
        <FloatingWhatsApp phone={settings.whatsapp || settings.phone} locale={params.locale} />
        <CookieConsent locale={params.locale} />
      </FavoritesProvider>
    </CartProvider>
  );
}
