import { CartProvider } from "@/components/storefront/CartProvider";
import { Footer } from "@/components/storefront/Footer";
import { Header } from "@/components/storefront/Header";

export default function StoreLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  return (
    <CartProvider>
      <Header locale={params.locale} />
      {children}
      <Footer locale={params.locale} />
    </CartProvider>
  );
}
