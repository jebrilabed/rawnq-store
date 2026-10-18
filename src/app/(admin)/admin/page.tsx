import Link from "next/link";
import Image from "next/image";
import { StatusSelect } from "@/components/admin/Controls";
import s from "@/components/admin/admin.module.css";
import { stats } from "@/lib/data/admin";
import { db } from "@/lib/data/db";
import { formatPrice } from "@/lib/format";

export default function Dashboard() {
  const st = stats();
  return (
    <>
      <div className={s.stats}>
        <div className={s.stat}><small>المنتجات</small><b>{st.products}</b></div>
        <div className={s.stat}><small>الطلبات</small><b>{st.orders}</b></div>
        <div className={s.stat}><small>مخزون منخفض</small><b>{st.low}</b></div>
        <div className={s.stat}><small>المبيعات</small><b>{formatPrice(st.sales)}</b></div>
      </div>
      <div className={s.bar}><h2>آخر الطلبات</h2><Link href="/admin/orders" className={s.sm}>كل الطلبات</Link></div>
      {db.orders.slice(0, 5).map((o) => (
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
