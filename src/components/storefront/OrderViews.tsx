"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { PAYMENT_LABEL, STATUS_LABEL, readOrders, type CustomerOrderListItem, type OrderSummary } from "@/lib/orders";
import { OrderStatusTracking } from "@/components/ui/OrderStatusTracking";
import s from "./storefront.module.css";
import { translate } from "@/lib/i18n";

function useOrders() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  useEffect(() => setOrders(readOrders()), []);
  return orders;
}
const fmtDate = (iso: string, locale: string) => new Date(iso).toLocaleDateString(locale);

export function OrdersList({ locale, orders }: { locale: string; orders: CustomerOrderListItem[] }) {
  const tr = (text: string) => translate(locale, text);
  if (!orders.length) {
    return (
      <div className={s.empty}>
        <h2>{tr("لا توجد طلبات بعد")}</h2>
        <Link className={s.btn} href={`/${locale}/products`}>{tr("تصفح المنتجات")}</Link>
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
              <b>{tr("طلب")} {o.orderNumber}</b>
              <span className={s.muted}>{fmtDate(o.createdAt, locale)}</span>
              <span>{o.itemCount} · {formatPrice(o.total, locale)}</span>
            </div>
            <span className={s.pill}>{tr(STATUS_LABEL[o.status])}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

export function OrderDetail({ locale, orderNumber, order, confirmation, deliveryPending }: {
  locale: string; orderNumber: string; order?: OrderSummary; confirmation?: boolean; deliveryPending?: boolean;
}) {
  const tr = (text: string) => translate(locale, text);
  if (!order) {
    return (
      <div className={s.empty}>
        <h2>{tr("الطلب غير موجود")}</h2>
        <Link className={s.btn} href={`/${locale}/orders`}>{tr("طلباتي")}</Link>
      </div>
    );
  }
  const o = order;
  return (
    <>
      {confirmation && (
        <div className={s.empty} style={{ paddingTop: 10 }}>
          <CheckCircle2 size={48} color="var(--teal)" />
          <h2>{tr("تم استلام طلبك")}</h2>
          <p>{tr("رقم الطلب:")} <b>{o.orderNumber}</b></p>
          <p className={s.muted}>{deliveryPending
            ? tr("تم استلام طلبك، لكن تعذر تأكيد إرسال طلب التوصيل تلقائياً. سنتواصل معك قريباً.")
            : tr("سنتواصل معك قريباً لتأكيد التوصيل.")}</p>
        </div>
      )}
      {!confirmation && <p className={s.muted}>{fmtDate(o.createdAt, locale)} · <span className={s.pill}>{tr(STATUS_LABEL[o.status])}</span></p>}
      <OrderStatusTracking status={o.status} history={o.statusHistory} locale={locale} />
      {o.items.map((i, k) => (
        <div key={k} className={s.line}>
          <Image src={i.image} alt="" width={64} height={64} />
          <div className={s.lineBody}>
            <b>{tr(i.name)}</b>
            {i.option && <small className={s.muted}>{tr(i.option)}</small>}
            <span>{i.qty} × {formatPrice(i.unitPrice, locale)}</span>
          </div>
        </div>
      ))}
      <div className={s.summary}>
        <div><span>{tr("المجموع")}</span><b>{formatPrice(o.subtotal, locale)}</b></div>
        <div><span>{tr("الشحن")}</span><b>{formatPrice(o.shipping, locale)}</b></div>
        <div className={s.total}><span>{tr("الإجمالي")}</span><b>{formatPrice(o.total, locale)}</b></div>
      </div>
      <div className={s.summary}>
        <div><span>{tr("العنوان")}</span><b>{o.customer.city}، {o.customer.address}</b></div>
        {o.deliveryAreaName && <div><span>{tr("منطقة التوصيل")}</span><b>{tr(o.deliveryAreaName)}</b></div>}
        <div><span>{tr("الدفع")}</span><b>{tr(PAYMENT_LABEL[o.payment])}</b></div>
        {o.paymentReceiptUrl && <div><span>{tr("إيصال التحويل")}</span><a className={s.link} href={o.paymentReceiptUrl} target="_blank" rel="noreferrer">{tr("عرض الإيصال")}</a></div>}
      </div>
      <Link className={s.btn} href={`/${locale}/products`}>{tr("متابعة التسوق")}</Link>
    </>
  );
}

export function OrderConfirmation({ locale, orderNumber, initialOrder, deliveryPending }: {
  locale: string; orderNumber: string; initialOrder?: OrderSummary; deliveryPending?: boolean;
}) {
  const localOrders = useOrders();
  if (!initialOrder && !localOrders) return null;
  const order = initialOrder ?? localOrders?.find((item) => item.orderNumber === orderNumber);
  return <OrderDetail locale={locale} orderNumber={orderNumber} order={order} confirmation deliveryPending={deliveryPending} />;
}
