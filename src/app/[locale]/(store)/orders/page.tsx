import { auth } from "@/auth";
import { OrdersList } from "@/components/storefront/OrderViews";
import { getCustomerOrders } from "@/lib/data/admin";
import s from "@/components/storefront/storefront.module.css";
import { redirect } from "next/navigation";
import { translate } from "@/lib/i18n";

export default async function OrdersPage({ params }: { params: { locale: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/${params.locale}/login?next=orders`);
  const orders = await getCustomerOrders(session.user.id);
  const title = translate(params.locale, "طلباتي");
  return (
    <main className={`${s.wrap} ${s.section}`}>
      <div className={s.head}><h1>{title}</h1></div>
      <OrdersList locale={params.locale} orders={orders} />
    </main>
  );
}
