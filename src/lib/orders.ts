export type OrderStatus = "NEW" | "PROCESSING" | "SHIPPED" | "DONE" | "CANCELLED";
export const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "جديد", PROCESSING: "قيد التجهيز", SHIPPED: "خرج للتوصيل", DONE: "مكتمل", CANCELLED: "ملغي",
};
export type OrderItem = { slug: string; name: string; image: string; option?: string; qty: number; unitPrice: number };
export type OrderSummary = {
  orderNumber: string; createdAt: string; status: OrderStatus;
  customer: { name: string; phone: string; city: string; address: string; notes?: string };
  payment: "cod" | "bank"; deliveryAreaName?: string; paymentReceiptUrl?: string;
  items: OrderItem[]; subtotal: number; shipping: number; total: number;
};
export type CustomerOrderListItem = {
  orderNumber: string; createdAt: string; status: OrderStatus; itemCount: number; image: string; total: number;
};
export const PAYMENT_LABEL = { cod: "الدفع عند التوصيل", bank: "الدفع الفوري بالتحويل البنكي" } as const;

/** Keep a local receipt copy for guest confirmation; saved orders remain in PostgreSQL. */
const KEY = "rawnq-orders";
export function readOrders(): OrderSummary[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
export function saveOrder(order: OrderSummary) {
  try { localStorage.setItem(KEY, JSON.stringify([order, ...readOrders()])); } catch { /* ignore */ }
}
