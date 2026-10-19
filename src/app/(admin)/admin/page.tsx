import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ArrowUpLeft, Boxes, Package, ShoppingBag, Wallet } from "lucide-react";
import { StatusSelect } from "@/components/admin/Controls";
import s from "@/components/admin/admin.module.css";
import { getRecentOrders, stats } from "@/lib/data/admin";
import { formatPrice } from "@/lib/format";

export default async function Dashboard() {
  const [st, orders] = await Promise.all([stats(), getRecentOrders()]);
  return (
    <>
      <header className={s.pageHeader}>
        <div><span className={s.eyebrow}>نظرة عامة</span><h1>الرئيسية</h1><p>ملخص حركة المتجر والمهام التي تحتاج متابعة.</p></div>
        <div className={s.pageActions}><Link href="/admin/products/new" className={s.btn}><Package size={16} /> إضافة منتج</Link></div>
      </header>
      <div className={s.stats}>
        <div className={s.stat}><div className={s.statTop}>المنتجات <span className={`${s.statIcon} ${s.greenIcon}`}><Package size={17} /></span></div><b className={s.statValue}>{st.products}</b><small className={s.statNote}>منتج مسجل في الكتالوج</small></div>
        <div className={s.stat}><div className={s.statTop}>الطلبات <span className={`${s.statIcon} ${s.blueIcon}`}><ShoppingBag size={17} /></span></div><b className={s.statValue}>{st.orders}</b><small className={s.statNote}>إجمالي الطلبات المسجلة</small></div>
        <div className={s.stat}><div className={s.statTop}>مخزون منخفض <span className={`${s.statIcon} ${s.redIcon}`}><AlertTriangle size={17} /></span></div><b className={s.statValue}>{st.low}</b><small className={s.statNote}>منتج عند حد التنبيه أو أقل</small></div>
        <div className={s.stat}><div className={s.statTop}>المبيعات <span className={`${s.statIcon} ${s.amberIcon}`}><Wallet size={17} /></span></div><b className={s.statValue}>{formatPrice(st.sales)}</b><small className={s.statNote}>من الطلبات غير الملغاة</small></div>
      </div>
      <div className={s.sectionHead}><div><h2>أحدث الطلبات</h2><p>آخر ما وصل إلى المتجر</p></div><Link href="/admin/orders" className={s.btnGhost}>عرض كل الطلبات <ArrowUpLeft size={15} /></Link></div>
      {orders.length === 0 ? <div className={s.emptyState}>لا توجد طلبات حتى الآن.</div> : (
        <div className={s.tableWrap}><table className={s.table}>
          <thead><tr><th>الطلب</th><th>العميل</th><th>الإجمالي</th><th>الحالة</th><th>الإجراء</th></tr></thead>
          <tbody>{orders.map((o) => (
            <tr key={o.orderNumber}>
              <td><div className={s.itemCell}><Image className={s.thumb} src={o.image} alt="" width={42} height={42} /><b>{o.orderNumber}</b></div></td>
              <td>{o.customerName}</td><td><b>{formatPrice(o.total)}</b></td>
              <td><StatusSelect orderNumber={o.orderNumber} status={o.status} /></td>
              <td><Link href={`/admin/orders/${o.orderNumber}`} className={s.sm}>التفاصيل</Link></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      <div className={s.sectionHead}><div><h2>اختصارات الإدارة</h2><p>انتقل مباشرة إلى المهام اليومية</p></div></div>
      <div className={s.pageActions}>
        <Link href="/admin/inventory" className={s.btnGhost}><Boxes size={16} /> مراجعة المخزون</Link>
        <Link href="/admin/products" className={s.btnGhost}><Package size={16} /> إدارة المنتجات</Link>
      </div>
    </>
  );
}
