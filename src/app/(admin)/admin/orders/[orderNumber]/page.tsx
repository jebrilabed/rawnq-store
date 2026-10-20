import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusSelect } from "@/components/admin/Controls";
import s from "@/components/admin/admin.module.css";
import { getBestRouteShipment, getOrder } from "@/lib/data/admin";
import { BestRouteOrderButton } from "@/components/admin/BestRouteOrderButton";
import { formatPrice } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/orders";

export default async function OrderAdmin({ params }: { params: { orderNumber: string } }) {
  const [o, shipment] = await Promise.all([getOrder(params.orderNumber), getBestRouteShipment(params.orderNumber)]);
  if (!o) notFound();
  return (
    <>
      <header className={s.pageHeader}>
        <div><span className={s.eyebrow}>تفاصيل الطلب</span><h1>{o.orderNumber}</h1><p>{new Date(o.createdAt).toLocaleString("ar")}</p></div>
        <div className={s.pageActions}><StatusSelect orderNumber={o.orderNumber} status={o.status} /><Link href="/admin/orders" className={s.btnGhost}>العودة للطلبات</Link></div>
      </header>
      {shipment && <BestRouteOrderButton orderNumber={o.orderNumber} payment={o.payment} orderStatus={o.status}
        shipment={shipment} orderTypeConfigured={Boolean(process.env.BEST_ROUTE_ORDER_TYPE_ID?.trim())} />}
      <div className={s.sectionHead}><div><h2>المنتجات</h2><p>{o.items.length} صنف في هذا الطلب</p></div></div>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>المنتج</th><th>الخيار</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
        <tbody>{o.items.map((i, k) => (
          <tr key={k}><td><div className={s.itemCell}><Image className={s.thumb} src={i.image} alt="" width={42} height={42} /><b>{i.name}</b></div></td>
            <td>{i.option || "—"}</td><td>{i.qty}</td><td>{formatPrice(i.unitPrice)}</td><td><b>{formatPrice(i.qty * i.unitPrice)}</b></td>
          </tr>
        ))}</tbody>
      </table></div>
      <div className={s.sectionHead}><div><h2>ملخص الدفع والتوصيل</h2></div></div>
      <div className={s.kv}><span>المجموع</span><b>{formatPrice(o.subtotal)}</b></div>
      <div className={s.kv}><span>الشحن</span><b>{formatPrice(o.shipping)}</b></div>
      <div className={s.kv}><b>الإجمالي</b><b>{formatPrice(o.total)}</b></div>
      <h2 style={{ fontSize: "1rem", margin: "16px 0 8px" }}>العميل</h2>
      {o.deliveryAreaName && <div className={s.kv}><span>منطقة التوصيل</span><b>{o.deliveryAreaName}</b></div>}
      <div className={s.kv}><span>الاسم</span><b>{o.customer.name}</b></div>
      <div className={s.kv}><span>الهاتف</span><b dir="ltr">{o.customer.phone}</b></div>
      <div className={s.kv}><span>المدينة</span><b>{o.customer.city}</b></div>
      <div className={s.kv}><span>العنوان</span><b>{o.customer.address}</b></div>
      <div className={s.kv}><span>الدفع</span><b>{PAYMENT_LABEL[o.payment]}</b></div>
      {o.paymentReceiptUrl && <div className={s.kv}><span>إيصال التحويل</span><a className={s.sm} href={o.paymentReceiptUrl} target="_blank" rel="noreferrer">عرض الإيصال</a></div>}
      {o.customer.notes && <div className={s.kv}><span>ملاحظات</span><b>{o.customer.notes}</b></div>}
    </>
  );
}
