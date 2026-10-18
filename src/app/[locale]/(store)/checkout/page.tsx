import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import s from "@/components/storefront/storefront.module.css";
import { db } from "@/lib/data/db";

export const dynamic = "force-dynamic";

export default function CheckoutPage({ params }: { params: { locale: string } }) {
  const { shippingFee, freeShippingFrom, cod, bank, bankDetails } = db.settings;
  return (
    <main className={`${s.wrap} ${s.section}`}>
      <div className={s.head}><h1>إتمام الطلب</h1></div>
      <CheckoutForm locale={params.locale} shippingFee={shippingFee} freeFrom={freeShippingFrom} methods={{ cod, bank, bankDetails }} />
    </main>
  );
}
