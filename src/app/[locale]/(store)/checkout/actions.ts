"use server";
import { randomInt } from "node:crypto";
import { commitOrder } from "@/lib/data/admin";
import { getProduct } from "@/lib/data/catalog";
import { db } from "@/lib/data/db";
import { shippingFor } from "@/lib/pricing";
import type { OrderItem, OrderSummary } from "@/lib/orders";

export type PlaceOrderInput = {
  customer: { name: string; phone: string; city: string; address: string; notes?: string };
  payment: "cod" | "bank";
  lines: { slug: string; option?: string; qty: number }[];
};
export type PlaceOrderResult = { ok: true; order: OrderSummary } | { ok: false; error: string };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * لا نثق بأي سعر أو اسم قادم من المتصفح: نعيد بناء الطلب من الكتالوج على الخادم.
 * في الإنتاج نفّذ نفس الخطوات داخل معاملة Prisma واحدة: قفل صفوف SKU، خصم المخزون شرطياً،
 * إنشاء الطلب ولقطات الأسطر، مع مفتاح idempotency فريد لمنع التكرار.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const customer = {
    name: clean(input.customer?.name, 80), phone: clean(input.customer?.phone, 20),
    city: clean(input.customer?.city, 60), address: clean(input.customer?.address, 200), notes: clean(input.customer?.notes, 300),
  };
  if (customer.name.length < 2) return { ok: false, error: "أدخل الاسم الكامل." };
  if (!/^[0-9+\s-]{8,20}$/.test(customer.phone)) return { ok: false, error: "رقم الهاتف غير صحيح." };
  if (customer.city.length < 2 || customer.address.length < 4) return { ok: false, error: "أدخل المدينة والعنوان بالتفصيل." };
  const st = db.settings;
  if ((input.payment !== "cod" && input.payment !== "bank") || !st[input.payment]) return { ok: false, error: "اختر طريقة الدفع." };
  if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > 50) return { ok: false, error: "السلة فارغة." };

  const items: OrderItem[] = [];
  for (const line of input.lines) {
    const qty = Number(line.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return { ok: false, error: "كمية غير صحيحة." };
    const product = await getProduct(String(line.slug));
    if (!product) return { ok: false, error: "أحد المنتجات لم يعد متوفراً." };

    let stock = product.stock;
    let unitPrice = product.price;
    if (product.variants.length) {
      const variant = product.variants.find((v) => [v.color, v.size].filter(Boolean).join(" / ") === (line.option ?? ""));
      if (!variant) return { ok: false, error: `اختر خيارات ${product.name}.` };
      stock = variant.stock;
      unitPrice = variant.price ?? product.price;
    }
    if (stock < qty) return { ok: false, error: `الكمية المطلوبة من ${product.name} غير متوفرة.` };
    items.push({ slug: product.slug, name: product.name, image: product.image, option: line.option || undefined, qty, unitPrice });
  }

  const subtotal = items.reduce((n, i) => n + i.qty * i.unitPrice, 0);
  const shipping = shippingFor(subtotal, st.shippingFee, st.freeShippingFrom);
  const order: OrderSummary = {
    orderNumber: `RQ-${randomInt(100000, 1000000)}`,
    createdAt: new Date().toISOString(),
    status: "NEW", customer, payment: input.payment, items,
    subtotal, shipping, total: subtotal + shipping,
  };
  commitOrder(order);
  return { ok: true, order };
}
