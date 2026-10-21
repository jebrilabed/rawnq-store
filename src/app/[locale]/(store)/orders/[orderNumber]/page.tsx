import Link from "next/link";
import { auth } from "@/auth";
import { OrderDetail } from "@/components/storefront/OrderViews";
import { getCustomerOrder } from "@/lib/data/admin";
import s from "@/components/storefront/storefront.module.css";
import { notFound, redirect } from "next/navigation";
import { translate } from "@/lib/i18n";

export default async function OrderPage({ params }: { params: { locale: string; orderNumber: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/${params.locale}/login?next=orders`);
  const order = await getCustomerOrder(session.user.id, params.orderNumber);
  if (!order) notFound();
  const title = translate(params.locale, "طلب");
  const ordersLabel = translate(params.locale, "طلباتي");
  return (
    <main className={`${s.wrap} ${s.section}`}>
      <div className={s.head}><h1>{title} {params.orderNumber}</h1><Link href={`/${params.locale}/orders`}>← {ordersLabel}</Link></div>
      <OrderDetail locale={params.locale} orderNumber={params.orderNumber} order={order} />
    </main>
  );
}
