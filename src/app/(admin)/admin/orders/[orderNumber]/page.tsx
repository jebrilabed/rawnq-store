import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusSelect } from "@/components/admin/Controls";
import s from "@/components/admin/admin.module.css";
import { getOrder } from "@/lib/data/admin";
import { formatPrice } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/orders";

export default function OrderAdmin({ params }: { params: { orderNumber: string } }) {
  const o = getOrder(params.orderNumber);
  if (!o) notFound();
  return (
    <>
      <div className={s.bar}><h1>طلب {o.orderNumber}</h1><Link href="/admin/orders" className={s.sm}>← الطلبات</Link></div>
      <p className={s.muted} style={{ marginBottom: 10 }}>{new Date(o.createdAt).toLocaleString("ar")}</p>
      <div style={{ marginBottom: 12 }}><StatusSelect orderNumber={o.orderNumber} status={o.status} /></div>
      <h2 style={{ fontSize: "1rem", margin: "12px 0 8px" }}>المنتجات</h2>
      {o.items.map((i, k) => (
        <div key={k} className={s.row}>
          <Image src={i.image} alt="" width={56} height={56} />
          <div className={s.grow}><b>{i.name}</b><small>{i.option ? `${i.option} · ` : ""}{i.qty} × {formatPrice(i.unitPrice)}</small></div>
          <b>{formatPrice(i.qty * i.unitPrice)}</b>
        </div>
      ))}
      <div className={s.kv}><span>المجموع</span><b>{formatPrice(o.subtotal)}</b></div>
      <div className={s.kv}><span>الشحن</span><b>{formatPrice(o.shipping)}</b></div>
      <div className={s.kv}><b>الإجمالي</b><b>{formatPrice(o.total)}</b></div>
      <h2 style={{ fontSize: "1rem", margin: "16px 0 8px" }}>العميل</h2>
      <div className={s.kv}><span>الاسم</span><b>{o.customer.name}</b></div>
      <div className={s.kv}><span>الهاتف</span><b dir="ltr">{o.customer.phone}</b></div>
      <div className={s.kv}><span>المدينة</span><b>{o.customer.city}</b></div>
      <div className={s.kv}><span>العنوان</span><b>{o.customer.address}</b></div>
      <div className={s.kv}><span>الدفع</span><b>{PAYMENT_LABEL[o.payment]}</b></div>
      {o.customer.notes && <div className={s.kv}><span>ملاحظات</span><b>{o.customer.notes}</b></div>}
    </>
  );
}
