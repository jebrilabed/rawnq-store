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

/**
 * Arabic → English alias map for city matching against Taiar's English city list.
 * Keys are the Arabic city names used in the Rawnq store (from best-route-areas.json).
 * Values are English substrings to look for in a Taiar city name.
 */
const CITY_ALIASES: Record<string, string[]> = {
  // ---- Ramallah area ----
  "رام الله":          ["Ramallah"],
  "ضواحي رام الله":    ["Ramallah"],
  "البيرة":            ["Al-Bireh"],
  "الرام":             ["Al-Ram"],
  // ---- Nablus ----
  "نابلس":             ["Nablus"],
  // ---- Hebron ----
  "الخليل":            ["Hebron"],
  "قرى الخليل":        ["Hebron"],
  "يطا":               ["Hebron / Yatta"],
  // ---- Jenin ----
  "جنين":              ["Jenin"],
  "قباطية":            ["Jenin / Qabatiya"],
  // ---- Tulkarm ----
  "طولكرم":            ["Tulkarm"],
  // ---- Qalqilya ----
  "قلقيلية":           ["Qalqilya"],
  // ---- Bethlehem ----
  "بيت لحم":           ["Bethlehem"],
  "ضواحي بيت لحم":     ["Bethlehem"],
  // ---- Jericho ----
  "اريحا":             ["Jericho"],
  // ---- Salfit ----
  "سلفيت":             ["Salfit", "Salvit"],
  // ---- Tubas ----
  "طوباس":             ["Tubas"],
  // ---- Jerusalem ----
  "القدس":             ["Jerusalem"],
  "ضواحي القدس":       ["Jerusalem Suburbs", "Suburbs of Jerusalem"],
  "القدس الغربية":     ["Jerusalem"],
  "مخيم شعفاط":        ["Jerusalem"],
  "كفر عقب":           ["Jerusalem / Kufr Aqab", "Jerusalem"],
  "العيزرية":          ["Jerusalem / Al-Eizariya", "Jerusalem"],
  "الزعيم":            ["Suburbs of Jerusalem / Leader", "Jerusalem"],
  "عناتا":             ["Jerusalem"],
  "عين رافا":          ["Jerusalem / Ein Rava"],
  "عين نقربا":         ["Jerusalem"],
  "ابو ديس":           ["Jerusalem"],
  "السواحرة الشرقية":  ["Jerusalem"],
  // ---- 48 Territories ----
  "الداخل":            ["48 Territories", "Lands 48", "Land 48"],
  "الضفة الغربية":     ["West Bank"],
  "حيفا":              ["Lands 48 / Haifa"],
  "الناصرة":           ["48 Territories", "Lands 48"],
  "سخنين":             ["48 Territories", "Lands 48"],
  "شفا عمرو":          ["Lands 48 / Shafa Amr"],
  "ام الفحم":          ["48 Territories", "Lands 48"],
  "إم الفحم":          ["48 Territories", "Lands 48"],
  "الطيبة المثلث":     ["Lands 48"],
  "باقة الشرقية":      ["Lands 48"],
  "باقة الغربية":      ["Lands 48"],
  "كفر قاسم":          ["Lands 48"],
  "مجد الكروم":        ["Lands 48"],
  "دير الاسد":         ["Lands 48"],
  "تل ابيب":           ["Lands 48"],
  "رهط":               ["Lands 48"],
  "قلنسوة":            ["Lands 48"],
  // ---- Tulkarm sub-areas ----
  "بديا":              ["Qalqilya / Bedia", "West Bank"],
  "بلعا":              ["Tulkarm / Bala"],
  "بيت ليد":           ["Tulkarm / Beit Lid"],
  "دير الغصون":        ["Tulkarm / Deir al-Ghusun"],
  "عنبتا":             ["Tulkarm / Anabta"],
  "علار":              ["Tulkarm / Atil", "Tulkarm"],
  "عتيل":              ["Tulkarm / Attil"],
  "فرعون":             ["Tulkarm / Farun"],
  "قفين":              ["Tulkarm / Qaffin"],
  "كفر اللبد":         ["Tulkarm / Kafr al-Labad"],
  "كفر جمال":          ["Tulkarm / Kafr Jammal"],
  "السيباط":           ["Tulkarm", "West Bank"],
  "ابو غوش":           ["Jerusalem", "West Bank"],
  "زبمر":              ["Lands 48"],
  "بباقة":             ["Lands 48"],
  // ---- Gaza ----
  "غزة":               ["West Bank"],
  // ---- Virtual / catch-all ----
  "المنطقة الانفتراضية": ["West Bank"],
};

/**
 * Finds the best-matching Taiar city for a given store city name.
 * Strategy (in order of precedence):
 *  1. Exact normalised match against Taiar city names.
 *  2. Alias map lookup (Arabic → English search term).
 *  3. Partial English word match inside city name.
 *  4. First Taiar city whose root name contains the store name.
 */
export function findTaiarCity(
  storeCityName: string,
  taiarCities: import("@/lib/integrations/taiar").TaiarCity[],
): import("@/lib/integrations/taiar").TaiarCity | undefined {
  const normalised = normalizeCityName(storeCityName);

  // 1. Exact normalised match
  const exact = taiarCities.find(
    (c) => normalizeCityName(c.name) === normalised,
  );
  if (exact) return exact;

  // 2. Alias map — try each search term for the given Arabic name
  const aliasTerms =
    CITY_ALIASES[storeCityName.trim()] ??
    CITY_ALIASES[normalizeCityName(storeCityName)] ??
    // Also try without ال prefix
    CITY_ALIASES[storeCityName.trim().replace(/^ال/, "")] ??
    null;

  if (aliasTerms) {
    for (const term of aliasTerms) {
      const termLower = term.toLowerCase();
      // Prefer root-only match (e.g. "Ramallah" but not "Ramallah / Sub-area")
      const rootOnly = taiarCities.find((c) => {
        const cn = c.name.toLowerCase();
        return cn === termLower || cn.startsWith(termLower + " /") || cn.startsWith(termLower + "/");
      });
      if (rootOnly) return rootOnly;
    }
    // Fall back to any city containing the first term
    for (const term of aliasTerms) {
      const anyMatch = taiarCities.find((c) =>
        c.name.toLowerCase().includes(term.toLowerCase()),
      );
      if (anyMatch) return anyMatch;
    }
  }

  // 3. Partial normalised Arabic match — Taiar name contains the store name
  const partial = taiarCities.find((c) =>
    normalizeCityName(c.name).includes(normalised) ||
    normalised.includes(normalizeCityName(c.name)),
  );
  if (partial) return partial;

  return undefined;
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
  // If this order was historically sent to Best Route in the past, do not re-dispatch
  if (order.bestRouteState === "SENT") {
    return {
      ok: false,
      state: "NOT_SENT",
      error: "تم إرسال هذا الطلب سابقاً عبر Best Route.",
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
    const match = findTaiarCity(order.city, cities);
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
      paymentType: isCOD ? "cash" : "check",
      deliveryFee: 0,
      commission: 0,
      discount: 0,
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
