import { requireAdmin } from "@/lib/auth/require-admin";
import s from "@/components/admin/admin.module.css";
import { getOrders } from "@/lib/data/admin";
import { OrdersTableFilter } from "@/components/admin/OrdersTableFilter";

export default async function OrdersAdmin() {
  await requireAdmin();
  const orders = await getOrders();
  return (
    <>
      <header className={s.pageHeader}>
        <div>
          <span className={s.eyebrow}>المبيعات</span>
          <h1>الطلبات</h1>
          <p>راجع الطلبات الواردة، ابحث بالاسم أو الهاتف، حدّث حالتها، أو تواصل مع العميل مباشرة عبر واتساب.</p>
        </div>
        <span className={s.pill}>{orders.length} طلب</span>
      </header>
      {orders.length === 0 ? (
        <div className={s.emptyState}>لا توجد طلبات بعد.</div>
      ) : (
        <OrdersTableFilter initialOrders={orders} />
      )}
    </>
  );
}
