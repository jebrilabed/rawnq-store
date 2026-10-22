import { prisma } from "@/lib/data/prisma";
import { BestRouteRejectedError, createBestRouteOrder } from "@/lib/integrations/best-route";
import bestRouteAreaCatalog from "@/lib/integrations/best-route-areas.json";

type SendBestRouteOrderOptions = {
  bankPaymentConfirmed?: boolean;
  allowUnconfirmedBankPayment?: boolean;
};

export async function sendBestRouteOrder(orderNumber: string, options: SendBestRouteOrderOptions = {}) {
  const order = await prisma.storeOrder.findUnique({ where: { orderNumber }, include: { items: true } });
  if (!order) return { ok: false as const, state: "NOT_SENT", error: "لم أجد الطلب." };
  if (order.status === "CANCELLED") return { ok: false as const, state: order.bestRouteState, error: "لا يمكن إرسال طلب ملغي." };
  if (order.bestRouteState === "SENT") return { ok: false as const, state: "SENT", error: "تم إرسال هذا الطلب مسبقاً." };
  if (order.bestRouteState === "SENDING" || order.bestRouteState === "UNKNOWN") {
    return { ok: false as const, state: order.bestRouteState, error: "نتيجة الإرسال غير محسومة. تحقق في لوحة Best Route بالمرجع قبل أي إعادة محاولة." };
  }
  const rejectBeforeSend = async (error: string) => {
    await prisma.storeOrder.updateMany({
      where: { orderNumber, bestRouteState: { in: ["NOT_SENT", "REJECTED"] } },
      data: { bestRouteState: "REJECTED", bestRouteError: error, bestRouteUpdatedAt: new Date() },
    });
    return { ok: false as const, state: "REJECTED", error };
  };
  if (!process.env.BEST_ROUTE_LOGIN?.trim() || !process.env.BEST_ROUTE_PASSWORD) {
    return rejectBeforeSend("أضف بيانات BEST_ROUTE_LOGIN وBEST_ROUTE_PASSWORD إلى إعدادات الخادم.");
  }
  if (!process.env.BEST_ROUTE_ORDER_TYPE_ID?.trim()) {
    return rejectBeforeSend("حدد BEST_ROUTE_ORDER_TYPE_ID بعد فحص قائمة أنواع الطلبات.");
  }
  if (!bestRouteAreaCatalog.areas.some((area) => area.name === order.city)) {
    return rejectBeforeSend("مدينة الطلب غير موجودة في قائمة Best Route. راجع الطلب قبل الإرسال.");
  }
  if (order.payment === "bank" && options.bankPaymentConfirmed !== true && options.allowUnconfirmedBankPayment !== true) {
    return rejectBeforeSend("أكد استلام التحويل البنكي قبل إرسال الشحنة كمدفوعة.");
  }

  const claimed = await prisma.storeOrder.updateMany({
    where: { orderNumber, bestRouteState: { in: ["NOT_SENT", "REJECTED"] } },
    data: { bestRouteState: "SENDING", bestRouteError: null, bestRouteUpdatedAt: new Date() },
  });
  if (claimed.count !== 1) return { ok: false as const, state: "SENDING", error: "هناك محاولة إرسال أخرى لهذا الطلب." };

  const deliveryFeeOnCustomer = order.payment === "cod";
  const deliveryFeeOnSender = order.payment === "bank";
  const productNote = order.items.map((item) => `${item.name}${item.option ? ` (${item.option})` : ""} × ${item.qty}`).join("، ").slice(0, 1500);
  try {
    const result = await createBestRouteOrder({
      customer_name: order.customerName,
      customer_mobile: order.phone,
      customer_area: order.city,
      customer_address: [order.deliveryAreaName, order.address].filter(Boolean).join("، ").slice(0, 500),
      reference_id: order.orderNumber,
      cost: Number(order.subtotal),
      note: order.notes ?? "",
      paid: order.payment === "bank",
      delivery_fee_on_customer: deliveryFeeOnCustomer,
      delivery_fee_on_sender: deliveryFeeOnSender,
      product_note: productNote,
    });
    await prisma.storeOrder.update({
      where: { orderNumber },
      data: { bestRouteState: "SENT", bestRouteOrderId: result.orderId ?? null, bestRouteError: null, bestRouteUpdatedAt: new Date() },
    });
    return { ok: true as const, state: "SENT", orderId: result.orderId, referenceId: order.orderNumber };
  } catch (error) {
    const state = error instanceof BestRouteRejectedError ? "REJECTED" : "UNKNOWN";
    let message = error instanceof Error ? error.message : "تعذر إرسال الشحنة.";
    for (const secret of [process.env.BEST_ROUTE_LOGIN, process.env.BEST_ROUTE_PASSWORD]) {
      if (secret) message = message.replaceAll(secret, "[مخفي]");
    }
    message = message.slice(0, 220);
    await prisma.storeOrder.update({
      where: { orderNumber },
      data: { bestRouteState: state, bestRouteError: message, bestRouteUpdatedAt: new Date() },
    });
    return {
      ok: false as const,
      state,
      error: state === "UNKNOWN"
        ? "انقطع الاتصال بعد بدء الإرسال؛ تحقق في لوحة Best Route باستخدام رقم المرجع قبل إعادة المحاولة."
        : `رفض Best Route الطلب: ${message}`,
    };
  }
}
