"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { PAYMENT_LABEL, STATUS_LABEL, readOrders, type OrderSummary } from "@/lib/orders";
import s from "./storefront.module.css";

function useOrders() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  useEffect(() => setOrders(readOrders()), []);
  return orders;
}
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("ar");

export function OrdersList({ locale }: { locale: string }) {
  const orders = useOrders();
  if (!orders) return null;
  if (!orders.length) {
    return (
      <div className={s.empty}>
        <h2>لا توجد طلبات بعد</h2>
        <Link className={s.btn} href={`/${locale}/products`}>تصفح المنتجات</Link>
      </div>
    );
  }
  return (
    <>
      {orders.map((o) => (
        <Link key={o.orderNumber} href={`/${locale}/orders/${o.orderNumber}`} className={s.line}>
          <Image src={o.items[0].image} alt="" width={64} height={64} />
          <div className={s.lineBody}><b>{o.orderNumber}</b><span>{fmtDate(o.createdAt)} · {formatPrice(o.total)}</span></div>
          <span className={s.pill}>{STATUS_LABEL[o.status]}</span>
        </Link>
      ))}
    </>
  );
}

export function OrderDetail({ locale, orderNumber, confirmation }: { locale: string; orderNumber: string; confirmation?: boolean }) {
  const orders = useOrders();
  if (!orders) return null;
  const o = orders.find((x) => x.orderNumber === orderNumber);
  if (!o) {
    return (
      <div className={s.empty}>
        <h2>الطلب غير موجود على هذا الجهاز</h2>
        <Link className={s.btn} href={`/${locale}/orders`}>طلباتي</Link>
      </div>
    );
  }
  return (
    <>
      {confirmation && (
        <div className={s.empty} style={{ paddingTop: 10 }}>
          <CheckCircle2 size={48} color="var(--teal)" />
          <h2>تم استلام طلبك</h2>
          <p>رقم الطلب: <b>{o.orderNumber}</b></p>
          <p className={s.muted}>سنتواصل معك قريباً لتأكيد التوصيل.</p>
        </div>
      )}
      {!confirmation && <p className={s.muted}>{fmtDate(o.createdAt)} · <span className={s.pill}>{STATUS_LABEL[o.status]}</span></p>}
      {o.items.map((i, k) => (
        <div key={k} className={s.line}>
          <Image src={i.image} alt="" width={64} height={64} />
          <div className={s.lineBody}>
            <b>{i.name}</b>
            {i.option && <small className={s.muted}>{i.option}</small>}
            <span>{i.qty} × {formatPrice(i.unitPrice)}</span>
          </div>
        </div>
      ))}
      <div className={s.summary}>
        <div><span>المجموع</span><b>{formatPrice(o.subtotal)}</b></div>
        <div><span>الشحن</span><b>{formatPrice(o.shipping)}</b></div>
        <div className={s.total}><span>الإجمالي</span><b>{formatPrice(o.total)}</b></div>
      </div>
      <div className={s.summary}>
        <div><span>العنوان</span><b>{o.customer.city}، {o.customer.address}</b></div>
        <div><span>الدفع</span><b>{PAYMENT_LABEL[o.payment]}</b></div>
      </div>
      <Link className={s.btn} href={`/${locale}/products`}>متابعة التسوق</Link>
    </>
  );
}
