import Image from "next/image";
import Link from "next/link";
import { StatusSelect } from "@/components/admin/Controls";
import s from "@/components/admin/admin.module.css";
import { db } from "@/lib/data/db";
import { formatPrice } from "@/lib/format";

export default function OrdersAdmin() {
  return (
    <>
      <div className={s.bar}><h1>الطلبات</h1></div>
      {db.orders.length === 0 && <p className={s.muted}>لا توجد طلبات بعد.</p>}
      {db.orders.map((o) => (
        <div key={o.orderNumber} className={s.row}>
          <Image src={o.items[0].image} alt="" width={48} height={48} />
          <div className={s.grow}><b>{o.orderNumber}</b><small>{o.customer.name} · {formatPrice(o.total)}</small></div>
          <StatusSelect orderNumber={o.orderNumber} status={o.status} />
          <Link href={`/admin/orders/${o.orderNumber}`} className={s.sm}>التفاصيل</Link>
        </div>
      ))}
    </>
  );
}
