"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendBestRouteOrderAction } from "@/app/(admin)/admin/actions";
import { Spinner } from "@/components/ui/LoadingState";
import s from "./admin.module.css";

type Props = {
  orderNumber: string;
  payment: "cod" | "bank";
  orderStatus: string;
  shipment: { state: string; orderId?: string; error?: string; updatedAt?: string };
  orderTypeConfigured: boolean;
};

export function BestRouteOrderButton({ orderNumber, payment, orderStatus, shipment, orderTypeConfigured }: Props) {
  const router = useRouter();
  const [state, setState] = useState(shipment.state);
  const [orderId, setOrderId] = useState(shipment.orderId);
  const [error, setError] = useState(shipment.error ?? "");
  const [bankPaymentConfirmed, setBankPaymentConfirmed] = useState(false);
  const [pending, setPending] = useState(false);

  async function send() {
    if (pending || (payment === "bank" && !bankPaymentConfirmed) || !orderTypeConfigured || orderStatus === "CANCELLED") return;
    if (!confirm(`إرسال الطلب ${orderNumber} إلى Best Route؟ سيُنشئ ذلك شحنة فعلية.`)) return;
    setPending(true);
    setError("");
    try {
      const result = await sendBestRouteOrderAction(orderNumber, bankPaymentConfirmed);
      setState(result.state);
      if (result.ok) {
        setOrderId(result.orderId);
        setError("");
      } else setError(result.error);
      router.refresh();
    } catch {
      setState("UNKNOWN");
      setError("تعذر تأكيد نتيجة الإرسال. تحقق في لوحة Best Route برقم المرجع قبل إعادة المحاولة.");
      router.refresh();
    } finally { setPending(false); }
  }

  const alreadySent = state === "SENT";
  const uncertain = state === "UNKNOWN" || state === "SENDING";
  return (
    <section className={s.bestRouteShipment} aria-labelledby="best-route-shipment-heading">
      <div className={s.bestRouteHeading}>
        <div><h2 id="best-route-shipment-heading">الشحن عبر Best Route</h2>
          <p>يُرسل الطلب تلقائياً عند تسجيله؛ يمكنك إعادة المحاولة هنا إذا تعذر الإرسال. قيمة البضاعة هي المجموع الفرعي ورسوم التوصيل تُحدد حسب طريقة الدفع.</p>
        </div>
        {alreadySent && <b className={s.bestRouteOk}>تم الإرسال</b>}
      </div>
      <div className={s.bestRouteShipmentInfo}>
        <span>رقم المرجع</span><b dir="ltr">{orderNumber}</b>
        {orderId && <><span>رقم Best Route</span><b dir="ltr">{orderId}</b></>}
      </div>
      {payment === "bank" && !alreadySent && !uncertain && <label className={s.bestRouteConfirm}>
        <input type="checkbox" checked={bankPaymentConfirmed} onChange={(event) => setBankPaymentConfirmed(event.target.checked)} />
        تأكدت من وصول التحويل البنكي؛ سأرسل الشحنة كمدفوعة.
      </label>}
      {!orderTypeConfigured && !alreadySent && <p className={s.bestRouteNotice}>اضبط `BEST_ROUTE_ORDER_TYPE_ID` في إعدادات الخادم أولاً.</p>}
      {error && <p role="alert" className={uncertain ? s.bestRouteNotice : s.error}>{error}</p>}
      {uncertain && <p className={s.bestRouteNotice}>لا تعِد الإرسال قبل البحث في لوحة Best Route برقم المرجع؛ قد تكون الشحنة أُنشئت.</p>}
      {!alreadySent && !uncertain && <button type="button" className={s.btn} onClick={() => void send()}
        disabled={pending || !orderTypeConfigured || orderStatus === "CANCELLED" || (payment === "bank" && !bankPaymentConfirmed)} aria-busy={pending}>
        {pending ? <span className={s.actionPending}><Spinner /> جارٍ إرسال الشحنة…</span> : state === "REJECTED" ? "إعادة المحاولة بعد الرفض" : "إرسال الطلب إلى Best Route"}
      </button>}
      {state === "REJECTED" && !error && <p className={s.bestRouteNotice}>رفضت الشركة المحاولة السابقة؛ راجع البيانات قبل الإعادة.</p>}
    </section>
  );
}
