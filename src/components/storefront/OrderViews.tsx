"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { PAYMENT_LABEL, STATUS_LABEL, readOrders, type CustomerOrderListItem, type OrderSummary } from "@/lib/orders";
import s from "./storefront.module.css";

function useOrders() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  useEffect(() => setOrders(readOrders()), []);
  return orders;
}
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("ar");

export function OrdersList({ locale, orders }: { locale: string; orders: CustomerOrderListItem[] }) {
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
      <div className={s.ordersList}>
        {orders.map((o) => (
          <Link key={o.orderNumber} href={`/${locale}/orders/${o.orderNumber}`} className={s.orderRow}>
            <Image src={o.image} alt="" width={72} height={72} />
            <div className={s.lineBody}>
              <b>طلب {o.orderNumber}</b>
              <span className={s.muted}>{fmtDate(o.createdAt)}</span>
              <span>{o.itemCount} منتجات · {formatPrice(o.total)}</span>
            </div>
            <span className={s.pill}>{STATUS_LABEL[o.status]}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

export function OrderDetail({ locale, orderNumber, order, confirmation }: { locale: string; orderNumber: string; order?: OrderSummary; confirmation?: boolean }) {
  if (!order) {
    return (
      <div className={s.empty}>
        <h2>الطلب غير موجود</h2>
        <Link className={s.btn} href={`/${locale}/orders`}>طلباتي</Link>
      </div>
    );
  }
  const o = order;
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
        {o.deliveryAreaName && <div><span>منطقة التوصيل</span><b>{o.deliveryAreaName}</b></div>}
        <div><span>الدفع</span><b>{PAYMENT_LABEL[o.payment]}</b></div>
        {o.paymentReceiptUrl && <div><span>إيصال التحويل</span><a className={s.link} href={o.paymentReceiptUrl} target="_blank" rel="noreferrer">عرض الإيصال</a></div>}
      </div>
      <Link className={s.btn} href={`/${locale}/products`}>متابعة التسوق</Link>
    </>
  );
}

export function OrderConfirmation({ locale, orderNumber, initialOrder }: { locale: string; orderNumber: string; initialOrder?: OrderSummary }) {
  const localOrders = useOrders();
  if (!initialOrder && !localOrders) return null;
  const order = initialOrder ?? localOrders?.find((item) => item.orderNumber === orderNumber);
  return <OrderDetail locale={locale} orderNumber={orderNumber} order={order} confirmation />;
}
