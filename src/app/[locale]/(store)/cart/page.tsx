import { CartView } from "@/components/storefront/CartView";
import s from "@/components/storefront/storefront.module.css";

export const dynamic = "force-dynamic";

export default async function CartPage({ params }: { params: { locale: string } }) {
  return (
    <main className={`${s.wrap} ${s.section} ${s.compactPage}`}>
      <div className={s.head}><h1>سلة التسوق</h1></div>
      <CartView locale={params.locale} />
    </main>
  );
}
