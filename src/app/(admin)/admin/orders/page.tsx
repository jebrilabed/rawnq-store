import { requireAdmin } from "@/lib/auth/require-admin";
import Image from "next/image";
import Link from "next/link";
import { ConfirmButton, StatusSelect } from "@/components/admin/Controls";
import { deleteOrderAction } from "../actions";
import s from "@/components/admin/admin.module.css";
import { getOrders } from "@/lib/data/admin";
import { formatPrice } from "@/lib/format";

export default async function OrdersAdmin() {
  await requireAdmin();
  const orders = await getOrders();
  return (
    <>
      <header className={s.pageHeader}><div><span className={s.eyebrow}>المبيعات</span><h1>الطلبات</h1><p>راجع الطلبات الواردة وحدّث حالتها وتفاصيلها.</p></div><span className={s.pill}>{orders.length} طلب</span></header>
      {orders.length === 0 ? <div className={s.emptyState}>لا توجد طلبات بعد.</div> : (
        <div className={s.tableWrap}><table className={s.table}>
          <thead><tr><th>رقم الطلب</th><th>العميل</th><th>الإجمالي</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
          <tbody>{orders.map((o) => (
            <tr key={o.orderNumber}>
              <td><div className={s.itemCell}><Image className={s.thumb} src={o.image} alt="" width={42} height={42} /><b>{o.orderNumber}</b></div></td>
              <td>{o.customerName}</td><td><b>{formatPrice(o.total)}</b></td>
              <td><StatusSelect orderNumber={o.orderNumber} status={o.status} /></td>
              <td><div className={s.cellActions}>
                <Link href={`/admin/orders/${o.orderNumber}`} className={s.sm}>فتح الطلب</Link>
                <form action={deleteOrderAction}>
                  <input type="hidden" name="orderNumber" value={o.orderNumber} />
                  <ConfirmButton className={`${s.sm} ${s.danger}`} message={`هل أنت متأكد من حذف الطلب رقم ${o.orderNumber} نهائياً؟`}>حذف</ConfirmButton>
                </form>
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
