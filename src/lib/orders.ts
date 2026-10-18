export type OrderStatus = "NEW" | "PROCESSING" | "SHIPPED" | "DONE" | "CANCELLED";
export const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "جديد", PROCESSING: "قيد التجهيز", SHIPPED: "خرج للتوصيل", DONE: "مكتمل", CANCELLED: "ملغي",
};
export type OrderItem = { slug: string; name: string; image: string; option?: string; qty: number; unitPrice: number };
export type OrderSummary = {
  orderNumber: string; createdAt: string; status: OrderStatus;
  customer: { name: string; phone: string; city: string; address: string; notes?: string };
  payment: "cod" | "bank"; items: OrderItem[]; subtotal: number; shipping: number; total: number;
};
export const PAYMENT_LABEL = { cod: "الدفع عند الاستلام", bank: "تحويل بنكي" } as const;

/**
 * تخزين الطلبات في المتصفح للتصميم فقط. في الإنتاج اقرأ الطلبات من قاعدة البيانات
 * مع تقييدها بصاحب الحساب، وللضيف استخدم رمزاً موقّعاً خاصاً بالطلب.
 */
const KEY = "rawnq-orders";
export function readOrders(): OrderSummary[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
export function saveOrder(order: OrderSummary) {
  try { localStorage.setItem(KEY, JSON.stringify([order, ...readOrders()])); } catch { /* ignore */ }
}
