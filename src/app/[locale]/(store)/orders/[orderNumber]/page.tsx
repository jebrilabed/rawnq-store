import Link from "next/link";
import { OrderDetail } from "@/components/storefront/OrderViews";
import s from "@/components/storefront/storefront.module.css";

export default function OrderPage({ params }: { params: { locale: string; orderNumber: string } }) {
  return (
    <main className={`${s.wrap} ${s.section}`}>
      <div className={s.head}><h1>طلب {params.orderNumber}</h1><Link href={`/${params.locale}/orders`}>← طلباتي</Link></div>
      <OrderDetail locale={params.locale} orderNumber={params.orderNumber} />
    </main>
  );
}
