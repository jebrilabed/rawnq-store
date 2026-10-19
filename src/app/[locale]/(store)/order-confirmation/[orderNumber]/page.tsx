import { OrderDetail } from "@/components/storefront/OrderViews";
import { auth } from "@/auth";
import { OrderConfirmation } from "@/components/storefront/OrderViews";
import { getCustomerOrder } from "@/lib/data/admin";
import s from "@/components/storefront/storefront.module.css";

export default async function ConfirmationPage({ params }: { params: { locale: string; orderNumber: string } }) {
  const session = await auth();
  const order = session?.user?.id
    ? await getCustomerOrder(session.user.id, params.orderNumber)
    : undefined;
  return (
    <main className={`${s.wrap} ${s.section}`}>
      <OrderConfirmation locale={params.locale} orderNumber={params.orderNumber} initialOrder={order} />
    </main>
  );
}
