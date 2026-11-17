"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  sendTaiarOrderAction,
  syncTaiarShipmentAction,
} from "@/app/(admin)/admin/actions";
import { Spinner } from "@/components/ui/LoadingState";
import { toast } from "@/components/ui/Toast";
import s from "./admin.module.css";

export type ShipmentInfo = {
  state: string;
  orderId?: string;
  referenceId?: string;
  error?: string;
  providerStatus?: string;
  moneyStatus?: string;
  deliveryFee?: number;
  syncedAt?: string;
};

type Props = {
  orderNumber: string;
  payment: "cod" | "bank";
  orderStatus: string;
  bestRoute?: {
    state: string;
    orderId?: string;
    error?: string;
    updatedAt?: string;
  };
  taiar: ShipmentInfo | null;
  taiarConfigured: boolean;
};

export function ShippingProviderPanel({
  orderNumber,
  payment,
  orderStatus,
  bestRoute,
  taiar: initialTaiar,
  taiarConfigured,
}: Props) {
  const router = useRouter();

  const [taiar, setTaiar] = useState(initialTaiar);
  const [bankPaymentConfirmed, setBankPaymentConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const taiarSent = taiar?.state === "SENT";
  const taiarUncertain = taiar?.state === "SENDING" || taiar?.state === "UNKNOWN";
  const taiarRejected = taiar?.state === "REJECTED";
  const notSent = !taiar || taiar.state === "NOT_SENT";

  // Check if this was historically sent via Best Route in the past
  const historicallySentViaBestRoute = bestRoute?.state === "SENT";

  // Action: Send / Re-send to Taiar
  async function handleSend() {
    if (pending || orderStatus === "CANCELLED") return;
    if (payment === "bank" && !bankPaymentConfirmed) return;

    if (!confirm(`إرسال الطلب ${orderNumber} إلى شركة طيار (Taiar)؟ سيُنشئ ذلك شحنة فعلية لدى شركة الشحن.`)) {
      return;
    }

    setPending(true);

    try {
      const result = await sendTaiarOrderAction(orderNumber, bankPaymentConfirmed);
      setTaiar((prev) => ({
        state: result.state,
        orderId: result.ok ? result.orderId : prev?.orderId,
        referenceId: result.ok ? result.referenceId : prev?.referenceId,
        error: result.ok ? undefined : result.error,
        providerStatus: prev?.providerStatus,
        moneyStatus: prev?.moneyStatus,
        deliveryFee: prev?.deliveryFee,
        syncedAt: result.ok ? new Date().toISOString() : prev?.syncedAt,
      }));

      if (result.ok) {
        toast.success(`تم إرسال الطلب إلى شركة طيار بنجاح (رقم الشحنة: ${result.orderId}).`);
      } else {
        toast.error(`تعذر إرسال الطلب إلى طيار: ${result.error}`);
      }
      router.refresh();
    } catch {
      setTaiar((prev) => ({
        state: "UNKNOWN",
        orderId: prev?.orderId,
        referenceId: orderNumber,
        error: "انقطع الاتصال بعد بدء الإرسال؛ تحقق في لوحة Taiar باستخدام رقم المرجع.",
      }));
      toast.error("تعذر تأكيد نتيجة الإرسال. تحقق في لوحة طيار برقم المرجع قبل أي إعادة محاولة.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  // Action: Sync status from Taiar
  async function handleSyncTaiar() {
    if (syncing || !taiar?.orderId) return;
    setSyncing(true);
    try {
      const result = await syncTaiarShipmentAction(orderNumber);
      if (result.ok) {
        setTaiar((prev) =>
          prev
            ? {
                ...prev,
                providerStatus: result.providerStatus,
                moneyStatus: result.moneyStatus,
                deliveryFee: result.deliveryFee ? parseFloat(result.deliveryFee) : prev.deliveryFee,
                syncedAt: new Date().toISOString(),
              }
            : null
        );
        toast.success("تم تحديث حالة الشحنة من طيار بنجاح.");
      } else {
        toast.error(`تعذر تحديث الحالة: ${result.error}`);
      }
      router.refresh();
    } catch {
      toast.error("فشل الاتصال بـ طيار لمزامنة الحالة.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section className={s.bestRouteShipment} aria-labelledby="shipping-management-heading">
      {/* Header */}
      <div className={s.bestRouteHeading}>
        <div>
          <h2 id="shipping-management-heading">إدارة الشحن (شركة طيار - Taiar)</h2>
          <p>
            يتم إرسال الطلبات تلقائياً لشركة طيار فور إتمام العميل للطلب. يمكنك متابعة حالة الشحنة أو إعادة إرسالها من هنا.
          </p>
        </div>
        <div>
          {taiarSent && (
            <span className={`${s.shipmentBadge} ${s.shipmentBadgeSent}`}>
              ✓ تم الإرسال عبر طيار
            </span>
          )}
          {taiarRejected && (
            <span className={`${s.shipmentBadge} ${s.shipmentBadgeFail}`}>
              تعذر الإرسال
            </span>
          )}
          {taiarUncertain && (
            <span className={`${s.shipmentBadge} ${s.shipmentBadgePending}`}>
              قيد التحقق / معلّق
            </span>
          )}
          {notSent && !historicallySentViaBestRoute && (
            <span className={`${s.shipmentBadge} ${s.shipmentBadgePending}`}>
              بانتظار الإرسال
            </span>
          )}
          {historicallySentViaBestRoute && (
            <span className={`${s.shipmentBadge} ${s.shipmentBadgeSent}`}>
              أُرسل سابقاً عبر Best Route
            </span>
          )}
        </div>
      </div>

      {/* Historical Best Route Notice */}
      {historicallySentViaBestRoute && (
        <p className={s.bestRouteNotice}>
          ملاحظة أرشيفية: هذا الطلب تم إرساله سابقاً عبر مزود الشحن القديم (Best Route) برقم الشحنة: {bestRoute?.orderId}.
        </p>
      )}

      {/* Shipment Details Box */}
      <div className={s.bestRouteShipmentInfo}>
        <span>رقم المرجع (الطلب)</span>
        <b dir="ltr">{orderNumber}</b>

        <span>شركة الشحن</span>
        <b>⚡ طيار (Taiar)</b>

        {taiar?.orderId && (
          <>
            <span>رقم الشحنة لدى طيار</span>
            <b dir="ltr">{taiar.orderId}</b>
          </>
        )}

        {taiarSent && taiar?.providerStatus && (
          <>
            <span>حالة الشحنة (طيار)</span>
            <b>{taiar.providerStatus}</b>
          </>
        )}

        {taiarSent && taiar?.moneyStatus && (
          <>
            <span>الحالة المالية</span>
            <b>{taiar.moneyStatus}</b>
          </>
        )}

        {taiarSent && taiar?.deliveryFee !== undefined && (
          <>
            <span>أجرة التوصيل المسجلة</span>
            <b>{taiar.deliveryFee} ₪</b>
          </>
        )}

        {taiarSent && taiar?.syncedAt && (
          <>
            <span>آخر مزامنة</span>
            <small>{new Date(taiar.syncedAt).toLocaleString("ar")}</small>
          </>
        )}
      </div>

      {/* Sync Button for Taiar */}
      {taiarSent && (
        <div>
          <button
            type="button"
            className={`${s.btnGhost} ${s.sm}`}
            onClick={() => void handleSyncTaiar()}
            disabled={syncing}
          >
            {syncing ? (
              <span className={s.actionPending}>
                <Spinner /> جاري المزامنة…
              </span>
            ) : (
              "🔄 تحديث حالة الشحنة من طيار"
            )}
          </button>
        </div>
      )}

      {/* Bank Payment Confirmation Checkbox (if needed) */}
      {payment === "bank" && !taiarSent && !taiarUncertain && (
        <label className={s.bestRouteConfirm}>
          <input
            type="checkbox"
            checked={bankPaymentConfirmed}
            onChange={(e) => setBankPaymentConfirmed(e.target.checked)}
            disabled={pending}
          />
          تأكدت من وصول التحويل البنكي لحساب المتجر؛ سأرسل الشحنة كمدفوعة مسبقاً.
        </label>
      )}

      {/* Configuration Notice */}
      {!taiarConfigured && !taiarSent && (
        <p className={s.bestRouteNotice}>
          اضبط متغيرات `TAIAR_PHONE` و `TAIAR_PASSWORD` و `TAIAR_SENDER_ID` في إعدادات الخادم أولاً.
        </p>
      )}

      {/* Error / Warning alerts */}
      {taiar?.error && (
        <p role="alert" className={taiarUncertain ? s.bestRouteNotice : s.error}>
          {taiar.error}
        </p>
      )}

      {taiarUncertain && (
        <p className={s.bestRouteNotice}>
          نتيجة الإرسال غير محسومة. تحقق في لوحة تحكم شركة طيار برقم المرجع ({orderNumber}) قبل
          أي محاولة إعادة إرسال لمنع تكرار الشحنة.
        </p>
      )}

      {orderStatus === "CANCELLED" && (
        <p className={s.bestRouteNotice}>
          هذا الطلب ملغي. لا يمكن إرسال طلبات ملغية إلى شركة الشحن.
        </p>
      )}

      {/* Dispatch / Retry Button for Taiar */}
      {!taiarSent && !taiarUncertain && (
        <div>
          <button
            type="button"
            className={s.btn}
            onClick={() => void handleSend()}
            disabled={
              pending ||
              !taiarConfigured ||
              orderStatus === "CANCELLED" ||
              (payment === "bank" && !bankPaymentConfirmed)
            }
            aria-busy={pending}
          >
            {pending ? (
              <span className={s.actionPending}>
                <Spinner /> جاري إرسال الشحنة إلى طيار…
              </span>
            ) : taiarRejected ? (
              "إعادة محاولة إرسال الشحنة إلى طيار"
            ) : (
              "إرسال الشحنة إلى طيار الآن"
            )}
          </button>
        </div>
      )}
    </section>
  );
}
