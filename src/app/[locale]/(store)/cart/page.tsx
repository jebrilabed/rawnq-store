import { CartView } from "@/components/storefront/CartView";
import s from "@/components/storefront/storefront.module.css";
import { db } from "@/lib/data/db";

export const dynamic = "force-dynamic";

export default function CartPage({ params }: { params: { locale: string } }) {
  const { shippingFee, freeShippingFrom } = db.settings;
  return (
    <main className={`${s.wrap} ${s.section}`}>
      <div className={s.head}><h1>سلة التسوق</h1></div>
      <CartView locale={params.locale} shippingFee={shippingFee} freeFrom={freeShippingFrom} />
    </main>
  );
}
