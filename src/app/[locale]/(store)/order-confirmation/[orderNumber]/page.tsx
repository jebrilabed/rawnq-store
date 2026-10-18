import { OrderDetail } from "@/components/storefront/OrderViews";
import s from "@/components/storefront/storefront.module.css";

export default function ConfirmationPage({ params }: { params: { locale: string; orderNumber: string } }) {
  return (
    <main className={`${s.wrap} ${s.section}`}>
      <OrderDetail locale={params.locale} orderNumber={params.orderNumber} confirmation />
    </main>
  );
}
