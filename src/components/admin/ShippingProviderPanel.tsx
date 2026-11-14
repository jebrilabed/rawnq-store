"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  sendBestRouteOrderAction,
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
  bestRoute: {
    state: string;
    orderId?: string;
    error?: string;
    updatedAt?: string;
  };
  taiar: ShipmentInfo | null;
  orderTypeConfigured: boolean;
  taiarConfigured: boolean;
};

type ProviderChoice = "BEST_ROUTE" | "TAIAR";

export function ShippingProviderPanel({
  orderNumber,
  payment,
  orderStatus,
  bestRoute: initialBestRoute,
  taiar: initialTaiar,
  orderTypeConfigured,
  taiarConfigured,
}: Props) {
  const router = useRouter();

  const [bestRoute, setBestRoute] = useState(initialBestRoute);
  const [taiar, setTaiar] = useState(initialTaiar);
  const [bankPaymentConfirmed, setBankPaymentConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Determine if a provider is already active/locked
  const bestRouteSent = bestRoute.state === "SENT";
  const taiarSent = taiar?.state === "SENT";
  const bestRouteUncertain = bestRoute.state === "SENDING" || bestRoute.state === "UNKNOWN";
  const taiarUncertain = taiar?.state === "SENDING" || taiar?.state === "UNKNOWN";

  const isLockedToBestRoute = bestRouteSent || bestRouteUncertain;
  const isLockedToTaiar = taiarSent || taiarUncertain;

  // Selected provider: default to locked provider, or previous rejected attempt, or null (unassigned)
  const initialSelection: ProviderChoice | null = isLockedToBestRoute
    ? "BEST_ROUTE"
    : isLockedToTaiar
    ? "TAIAR"
    : taiar?.state === "REJECTED"
    ? "TAIAR"
    : bestRoute.state === "REJECTED"
    ? "BEST_ROUTE"
    : null;

  const [selectedProvider, setSelectedProvider] = useState<ProviderChoice | null>(initialSelection);

  // Action: Send to selected provider
  async function handleSend() {
    if (!selectedProvider || pending || orderStatus === "CANCELLED") return;
    if (payment === "bank" && !bankPaymentConfirmed) return;

    const providerName = selectedProvider === "BEST_ROUTE" ? "Best Route" : "طيار (Taiar)";

    if (!confirm(`إرسال الطلب ${orderNumber} إلى ${providerName}؟ سيُنشئ ذلك شحنة فعلية لدى شركة الشحن.`)) {
      return;
    }

    setPending(true);

    try {
      if (selectedProvider === "BEST_ROUTE") {
        const result = await sendBestRouteOrderAction(orderNumber, bankPaymentConfirmed);
        setBestRoute({
          state: result.state,
          orderId: result.ok ? result.orderId : bestRoute.orderId,
          error: result.ok ? undefined : result.error,
          updatedAt: new Date().toISOString(),
        });

        if (result.ok) {
          toast.success(`تم إرسال الطلب إلى Best Route بنجاح (رقم الشحنة: ${result.orderId}).`);
        } else {
          toast.error(`تعذر إرسال الطلب إلى Best Route: ${result.error}`);
        }
      } else {
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
          toast.success(`تم إرسال الطلب إلى طيار (Taiar) بنجاح (رقم الشحنة: ${result.orderId}).`);
        } else {
          toast.error(`تعذر إرسال الطلب إلى طيار: ${result.error}`);
        }
      }
      router.refresh();
    } catch {
      if (selectedProvider === "BEST_ROUTE") {
        setBestRoute((prev) => ({
          ...prev,
          state: "UNKNOWN",
          error: "انقطع الاتصال بعد بدء الإرسال؛ تحقق في لوحة Best Route باستخدام رقم المرجع.",
        }));
      } else {
        setTaiar((prev) => ({
          state: "UNKNOWN",
          orderId: prev?.orderId,
          referenceId: orderNumber,
          error: "انقطع الاتصال بعد بدء الإرسال؛ تحقق في لوحة Taiar باستخدام رقم المرجع.",
        }));
      }
      toast.error("تعذر تأكيد نتيجة الإرسال. تحقق في لوحة شركة الشحن برقم المرجع قبل أي إعادة محاولة.");
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

  // Current active status
  const anySent = bestRouteSent || taiarSent;
  const anyUncertain = bestRouteUncertain || taiarUncertain;
  const currentProvider = bestRouteSent ? "BEST_ROUTE" : taiarSent ? "TAIAR" : selectedProvider;

  // Configuration check for currently chosen provider
  const currentConfigured =
    currentProvider === "BEST_ROUTE"
      ? orderTypeConfigured
      : currentProvider === "TAIAR"
      ? taiarConfigured
      : true;

  // Active error and state for selected provider
  const activeState =
    currentProvider === "BEST_ROUTE"
      ? bestRoute.state
      : currentProvider === "TAIAR"
      ? taiar?.state ?? "NOT_SENT"
      : "NOT_SENT";

  const activeError =
    currentProvider === "BEST_ROUTE"
      ? bestRoute.error
      : currentProvider === "TAIAR"
      ? taiar?.error
      : undefined;

  const activeOrderId =
    currentProvider === "BEST_ROUTE"
      ? bestRoute.orderId
      : currentProvider === "TAIAR"
      ? taiar?.orderId
      : undefined;

  return (
    <section className={s.bestRouteShipment} aria-labelledby="shipping-management-heading">
      {/* Header */}
      <div className={s.bestRouteHeading}>
        <div>
          <h2 id="shipping-management-heading">إدارة الشحن اللوجستي</h2>
          <p>
            اختر شركة الشحن المناسبة واعتمد إرسال الطلب يدوياً. لا يتم إرسال أي شحنة تلقائياً.
          </p>
        </div>
        <div>
          {bestRouteSent && (
            <span className={`${s.shipmentBadge} ${s.shipmentBadgeSent}`}>
              تم الإرسال عبر Best Route
            </span>
          )}
          {taiarSent && (
            <span className={`${s.shipmentBadge} ${s.shipmentBadgeSent}`}>
              تم الإرسال عبر طيار (Taiar)
            </span>
          )}
          {!anySent && !anyUncertain && (
            <span className={`${s.shipmentBadge} ${s.shipmentBadgePending}`}>
              بانتظار اختيار وتأكيد المسؤول
            </span>
          )}
          {anyUncertain && (
            <span className={`${s.shipmentBadge} ${s.shipmentBadgePending}`}>
              قيد التحقق / معلّق
            </span>
          )}
        </div>
      </div>

      {/* Provider Selector (enabled only if no shipment has been successfully sent) */}
      {!anySent && !anyUncertain && (
        <div className={s.shippingProviders}>
          <label className={s.label}>
            <span>اختيار شركة الشحن:</span>
          </label>
          <div className={s.providerBtns} role="radiogroup" aria-label="شركة الشحن">
            <button
              type="button"
              className={`${s.providerBtn} ${
                selectedProvider === "BEST_ROUTE" ? s.providerBtnActive : ""
              }`}
              onClick={() => setSelectedProvider("BEST_ROUTE")}
              disabled={pending}
            >
              <span>🚚 Best Route</span>
              {!orderTypeConfigured && <small className={s.muted}>(غير مهيأ)</small>}
            </button>

            <button
              type="button"
              className={`${s.providerBtn} ${
                selectedProvider === "TAIAR" ? s.providerBtnActive : ""
              }`}
              onClick={() => setSelectedProvider("TAIAR")}
              disabled={pending}
            >
              <span>⚡ طيار (Taiar)</span>
              {!taiarConfigured && <small className={s.muted}>(غير مهيأ)</small>}
            </button>
          </div>
        </div>
      )}

      {/* Shipment Details Box */}
      <div className={s.bestRouteShipmentInfo}>
        <span>رقم المرجع (الطلب)</span>
        <b dir="ltr">{orderNumber}</b>

        {selectedProvider && (
          <>
            <span>الشركة المحددة</span>
            <b>{selectedProvider === "BEST_ROUTE" ? "Best Route" : "طيار (Taiar)"}</b>
          </>
        )}

        {activeOrderId && (
          <>
            <span>رقم الشحنة لدى الشركة</span>
            <b dir="ltr">{activeOrderId}</b>
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
            <span>الحالة المالية (طيار)</span>
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

      {/* Bank Payment Confirmation Checkbox */}
      {payment === "bank" && !anySent && !anyUncertain && selectedProvider && (
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

      {/* Configuration Notices */}
      {selectedProvider === "BEST_ROUTE" && !orderTypeConfigured && !anySent && (
        <p className={s.bestRouteNotice}>
          اضبط متغير `BEST_ROUTE_ORDER_TYPE_ID` في إعدادات الخادم قبل إرسال الشحنة.
        </p>
      )}
      {selectedProvider === "TAIAR" && !taiarConfigured && !anySent && (
        <p className={s.bestRouteNotice}>
          اضبط متغيرات `TAIAR_PHONE` و `TAIAR_PASSWORD` و `TAIAR_SENDER_ID` في إعدادات الخادم أولاً.
        </p>
      )}

      {/* Error / Warning alerts */}
      {activeError && (
        <p role="alert" className={anyUncertain ? s.bestRouteNotice : s.error}>
          {activeError}
        </p>
      )}

      {anyUncertain && (
        <p className={s.bestRouteNotice}>
          نتيجة الإرسال غير محسومة. تحقق في لوحة تحكم شركة الشحن برقم المرجع ({orderNumber}) قبل
          أي محاولة إعادة إرسال لمنع تكرار الشحنة.
        </p>
      )}

      {orderStatus === "CANCELLED" && (
        <p className={s.bestRouteNotice}>
          هذا الطلب ملغي. لا يمكن إرسال طلبات ملغية إلى شركات الشحن.
        </p>
      )}

      {/* Dispatch / Retry Button */}
      {!anySent && !anyUncertain && selectedProvider && (
        <div>
          <button
            type="button"
            className={s.btn}
            onClick={() => void handleSend()}
            disabled={
              pending ||
              !currentConfigured ||
              orderStatus === "CANCELLED" ||
              (payment === "bank" && !bankPaymentConfirmed)
            }
            aria-busy={pending}
          >
            {pending ? (
              <span className={s.actionPending}>
                <Spinner /> جاري إرسال الشحنة…
              </span>
            ) : activeState === "REJECTED" ? (
              `إعادة محاولة الإرسال إلى ${
                selectedProvider === "BEST_ROUTE" ? "Best Route" : "طيار"
              }`
            ) : (
              `تأكيد وإرسال الشحنة إلى ${
                selectedProvider === "BEST_ROUTE" ? "Best Route" : "طيار"
              }`
            )}
          </button>
        </div>
      )}

      {/* Helpful advice when not yet selected */}
      {!anySent && !anyUncertain && !selectedProvider && (
        <p className={s.bestRouteNotice}>
          يرجى اختيار شركة الشحن (Best Route أو طيار) من الأزرار أعلاه لتفعيل زر الإرسال.
        </p>
      )}
    </section>
  );
}

