import { OrdersList } from "@/components/storefront/OrderViews";
import s from "@/components/storefront/storefront.module.css";

export default function OrdersPage({ params }: { params: { locale: string } }) {
  return (
    <main className={`${s.wrap} ${s.section}`}>
      <div className={s.head}><h1>طلباتي</h1></div>
      <OrdersList locale={params.locale} />
    </main>
  );
}
