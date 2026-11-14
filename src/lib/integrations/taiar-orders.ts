import { prisma } from "@/lib/data/prisma";
import {
  TaiarRejectedError,
  createTaiarOrder,
  getTaiarCities,
  getTaiarShipment,
  sanitizeTaiarError,
} from "@/lib/integrations/taiar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaiarShipmentState =
  | "NOT_SENT"
  | "SENDING"
  | "SENT"
  | "REJECTED"
  | "UNKNOWN";

type SendTaiarOrderOptions = {
  bankPaymentConfirmed?: boolean;
  allowUnconfirmedBankPayment?: boolean;
};

type SendTaiarOrderResult =
  | { ok: true; state: "SENT"; orderId: string; referenceId: string }
  | { ok: false; state: TaiarShipmentState; error: string };

type SyncTaiarResult =
  | { ok: true; state: "SENT"; providerStatus?: string; moneyStatus?: string; deliveryFee?: string }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TAIAR_PROVIDER = "TAIAR";

/** Returns a normalised, lowercase name for city matching (strips diacritics). */
export function normalizeCityName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه");
}

// ---------------------------------------------------------------------------
// sendTaiarOrder
// ---------------------------------------------------------------------------

/**
 * Dispatches a StoreOrder to Taiar.
 *
 * Guards:
 * - Order must exist and not be CANCELLED.
 * - No existing SENT Shipment for this order with TAIAR.
 * - No Shipment in SENDING or UNKNOWN state (uncertain — human must resolve).
 * - Bank payment requires explicit confirmation unless allowUnconfirmedBankPayment is set.
 * - The order's city must exist in Taiar's city list.
 *
 * Uses an atomic upsert to claim SENDING state before calling the API, so
 * concurrent requests cannot double-dispatch.
 */
export async function sendTaiarOrder(
  orderNumber: string,
  options: SendTaiarOrderOptions = {},
): Promise<SendTaiarOrderResult> {
  // ------------------------------------------------------------------
  // 1. Fetch order
  // ------------------------------------------------------------------
  const order = await prisma.storeOrder.findUnique({
    where: { orderNumber },
    include: { items: true, shipment: true },
  });

  if (!order) {
    return { ok: false, state: "NOT_SENT", error: "لم أجد الطلب." };
  }
  if (order.status === "CANCELLED") {
    return {
      ok: false,
      state: order.shipment?.state as TaiarShipmentState ?? "NOT_SENT",
      error: "لا يمكن إرسال طلب ملغي.",
    };
  }

  // ------------------------------------------------------------------
  // 2. Guard against duplicate / uncertain dispatch
  // ------------------------------------------------------------------
  if (order.bestRouteState === "SENT") {
    return {
      ok: false,
      state: "SENT",
      error: "�� ����� ��� ����� ��� Best Route ������ ��� ���� ������ ��� ����.",
    };
  }
  if (order.bestRouteState === "SENDING") {
    return {
      ok: false,
      state: "SENDING",
      error: "���� ������ ����� ����� ��� Best Route ���� �����.",
    };
  }

  const shipment = order.shipment;

  if (shipment && shipment.provider === TAIAR_PROVIDER) {
    if (shipment.state === "SENT") {
      return {
        ok: false,
        state: "SENT",
        error: "تم إرسال هذا الطلب إلى Taiar مسبقاً.",
      };
    }
    if (shipment.state === "SENDING" || shipment.state === "UNKNOWN") {
      return {
        ok: false,
        state: shipment.state as TaiarShipmentState,
        error:
          "نتيجة الإرسال السابق غير محسومة. تحقق في لوحة Taiar باستخدام رقم المرجع قبل إعادة المحاولة.",
      };
    }
  }

  // ------------------------------------------------------------------
  // Helper: reject before claiming SENDING (pre-flight checks)
  // ------------------------------------------------------------------
  const rejectBeforeSend = async (error: string): Promise<SendTaiarOrderResult> => {
    await prisma.shipment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        provider: TAIAR_PROVIDER,
        state: "REJECTED",
        referenceId: order.orderNumber,
        error,
      },
      update: {
        provider: TAIAR_PROVIDER,
        state: "REJECTED",
        referenceId: order.orderNumber,
        error,
        updatedAt: new Date(),
      },
    });
    return { ok: false, state: "REJECTED", error };
  };

  // ------------------------------------------------------------------
  // 3. Bank payment guard
  // ------------------------------------------------------------------
  if (
    order.payment === "bank" &&
    options.bankPaymentConfirmed !== true &&
    options.allowUnconfirmedBankPayment !== true
  ) {
    return rejectBeforeSend("أكد استلام التحويل البنكي قبل إرسال الشحنة كمدفوعة.");
  }

  // ------------------------------------------------------------------
  // 4. Resolve Taiar city ID from order city name
  // ------------------------------------------------------------------
  let taiarCityId: number;
  try {
    const cities = await getTaiarCities("ar");
    const normalizedOrderCity = normalizeCityName(order.city);
    const match = cities.find(
      (c) => normalizeCityName(c.name) === normalizedOrderCity,
    );
    if (!match) {
      return rejectBeforeSend(
        `مدينة الطلب "${order.city}" غير موجودة في قائمة مدن Taiar. راجع الطلب قبل الإرسال.`,
      );
    }
    taiarCityId = match.id;
  } catch (err) {
    const msg = err instanceof Error ? sanitizeTaiarError(err.message) : "فشل جلب قائمة مدن Taiar.";
    return { ok: false, state: "NOT_SENT", error: msg };
  }

  // ------------------------------------------------------------------
  // 5. Atomically claim SENDING state (upsert)
  //    If a concurrent request already claimed it, updateMany returns 0 rows.
  // ------------------------------------------------------------------
  const isCOD = order.payment === "cod";

  // Upsert: create with SENDING if no row; update only if state is NOT_SENT or REJECTED
  // We simulate an atomic "claim" by using updateMany on the existing row or creating fresh.
  // For true atomicity we try updateMany first (existing row in NOT_SENT/REJECTED), then
  // fall back to create if no row exists yet.

  let claimed = false;

  if (shipment) {
    // Row exists — try to transition it from NOT_SENT or REJECTED → SENDING
    const updated = await prisma.shipment.updateMany({
      where: {
        orderId: order.id,
        provider: TAIAR_PROVIDER,
        state: { in: ["NOT_SENT", "REJECTED"] },
      },
      data: {
        state: "SENDING",
        error: null,
        providerOrderId: null,
        updatedAt: new Date(),
      },
    });
    claimed = updated.count === 1;
  } else {
    // No row yet — create it in SENDING state
    try {
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          provider: TAIAR_PROVIDER,
          state: "SENDING",
          referenceId: order.orderNumber,
        },
      });
      claimed = true;
    } catch {
      // Race: another request created the row first
      claimed = false;
    }
  }

  if (!claimed) {
    return {
      ok: false,
      state: "SENDING",
      error: "هناك محاولة إرسال أخرى لهذا الطلب قيد التنفيذ.",
    };
  }

  // ------------------------------------------------------------------
  // 6. Build order payload and call Taiar
  // ------------------------------------------------------------------
  const firstItemName = order.items[0]?.name ?? "منتج";
  const title = firstItemName.slice(0, 100);
  const description = order.items
    .map((item) => `${item.name}${item.option ? ` (${item.option})` : ""} × ${item.qty}`)
    .join("، ")
    .slice(0, 500);
  const quantity = order.items.reduce((sum, item) => sum + item.qty, 0);
  const receiverAddress = [order.deliveryAreaName, order.address]
    .filter(Boolean)
    .join("، ")
    .slice(0, 500);

  try {
    const result = await createTaiarOrder({
      referenceId: order.orderNumber,
      receiverName: order.customerName,
      receiverMobile: order.phone,
      receiverCity: taiarCityId,
      receiverAddress,
      title,
      codValues: isCOD ? Number(order.subtotal) : 0,
      paymentType: isCOD ? 1 : 2,
      quantity,
      description,
      note: order.notes ?? "",
    });

    // Success: mark SENT
    await prisma.shipment.update({
      where: { orderId: order.id },
      data: {
        state: "SENT",
        providerOrderId: result.orderId,
        referenceId: result.referenceId,
        error: null,
        syncedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      ok: true,
      state: "SENT",
      orderId: result.orderId,
      referenceId: result.referenceId,
    };
  } catch (err) {
    const isRejected = err instanceof TaiarRejectedError;
    const newState: TaiarShipmentState = isRejected ? "REJECTED" : "UNKNOWN";

    let rawMessage = err instanceof Error ? err.message : "تعذر إرسال الشحنة.";
    rawMessage = sanitizeTaiarError(rawMessage);

    await prisma.shipment.update({
      where: { orderId: order.id },
      data: {
        state: newState,
        error: rawMessage,
        updatedAt: new Date(),
      },
    });

    const userMessage =
      newState === "UNKNOWN"
        ? "انقطع الاتصال بعد بدء الإرسال؛ تحقق في لوحة Taiar باستخدام رقم المرجع قبل إعادة المحاولة."
        : `رفض Taiar الطلب: ${rawMessage}`;

    return { ok: false, state: newState, error: userMessage };
  }
}

// ---------------------------------------------------------------------------
// syncTaiarShipmentStatus
// ---------------------------------------------------------------------------

/**
 * Fetches the current status of a dispatched Taiar shipment and updates the
 * local Shipment record. Only syncs orders that have been SENT (have a
 * providerOrderId).
 */
export async function syncTaiarShipmentStatus(orderNumber: string): Promise<SyncTaiarResult> {
  const order = await prisma.storeOrder.findUnique({
    where: { orderNumber },
    include: { shipment: true },
  });

  if (!order) return { ok: false, error: "لم أجد الطلب." };

  const shipment = order.shipment;
  if (!shipment || shipment.provider !== TAIAR_PROVIDER) {
    return { ok: false, error: "لا توجد شحنة Taiar مرتبطة بهذا الطلب." };
  }
  if (shipment.state !== "SENT" || !shipment.providerOrderId) {
    return { ok: false, error: "الشحنة لم تُرسل بعد أو لا يوجد معرّف شحنة." };
  }

  try {
    const details = await getTaiarShipment(shipment.providerOrderId);

    const providerStatus = details.status !== undefined ? String(details.status) : undefined;
    const moneyStatus =
      details.money_status !== undefined ? String(details.money_status) : undefined;
    const deliveryFee =
      details.delivery_fee !== undefined ? String(details.delivery_fee) : undefined;

    await prisma.shipment.update({
      where: { orderId: order.id },
      data: {
        providerStatus: providerStatus ?? null,
        moneyStatus: moneyStatus ?? null,
        deliveryFee: deliveryFee !== undefined ? parseFloat(deliveryFee) : null,
        syncedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      ok: true,
      state: "SENT",
      providerStatus,
      moneyStatus,
      deliveryFee,
    };
  } catch (err) {
    const msg = err instanceof Error ? sanitizeTaiarError(err.message) : "فشل مزامنة حالة الشحنة.";
    return { ok: false, error: msg };
  }
}
