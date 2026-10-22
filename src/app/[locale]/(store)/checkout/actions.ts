"use server";
import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { commitOrder, OrderCommitError } from "@/lib/data/admin";
import { getProduct } from "@/lib/data/catalog";
import { uploadTransferReceipt } from "@/lib/data/cloudinary";
import { getSettings } from "@/lib/data/db";
import { sendBestRouteOrder } from "@/lib/integrations/best-route-orders";
import type { OrderItem, OrderSummary } from "@/lib/orders";
import bestRouteAreaCatalog from "@/lib/integrations/best-route-areas.json";

export type PlaceOrderInput = {
  customer: { name: string; phone: string; city: string; address: string; notes?: string };
  payment: "cod" | "bank";
  deliveryAreaId: string;
  paymentReceiptUrl?: string;
  lines: { slug: string; option?: string; qty: number }[];
};
export type PlaceOrderResult = { ok: true; order: OrderSummary; deliverySent: boolean } | { ok: false; error: string };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const newOrderNumber = () => `RQ-${randomInt(100000, 1000000)}`;

export async function uploadTransferReceiptAction(form: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const file = form.get("receipt");
  if (!file || typeof file === "string" || !file.size) return { ok: false, error: "اختر صورة أو ملف PDF للإيصال." };
  if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type) || file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "الإيصال يجب أن يكون JPG أو PNG أو WebP أو PDF وبحجم لا يتجاوز 5 ميغابايت." };
  }
  try { return { ok: true, url: await uploadTransferReceipt(file) }; }
  catch { return { ok: false, error: "تعذر رفع الإيصال. حاول مرة أخرى." }; }
}

/**
 * لا نثق بأي سعر أو اسم قادم من المتصفح: نعيد بناء الطلب من الكتالوج على الخادم،
 * ثم نخصم المخزون ونحفظ الطلب داخل معاملة Prisma واحدة.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (!input || typeof input !== "object") return { ok: false, error: "بيانات الطلب غير صالحة." };
  const session = await auth();
  const customer = {
    name: clean(input.customer?.name, 80), phone: clean(input.customer?.phone, 20),
    city: clean(input.customer?.city, 60), address: clean(input.customer?.address, 200), notes: clean(input.customer?.notes, 300),
  };
  if (customer.name.length < 2) return { ok: false, error: "أدخل الاسم الكامل." };
  if (!/^[0-9+\s-]{8,20}$/.test(customer.phone)) return { ok: false, error: "رقم الهاتف غير صحيح." };
  if (!bestRouteAreaCatalog.areas.some((area) => area.name === customer.city) || customer.address.length < 4) {
    return { ok: false, error: "اختر المدينة أو المنطقة من القائمة وأدخل العنوان بالتفصيل." };
  }
  const st = await getSettings();
  if ((input.payment !== "cod" && input.payment !== "bank") || !st[input.payment]) return { ok: false, error: "اختر طريقة الدفع." };
  const areaId = clean(input.deliveryAreaId, 100);
  const deliveryArea = st.deliveryAreas.find((area) => area.id === areaId);
  if (!deliveryArea) return { ok: false, error: "اختر منطقة التوصيل." };
  const paymentReceiptUrl = clean(input.paymentReceiptUrl, 1000);
  if (input.payment === "bank") {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!paymentReceiptUrl || !cloudName
      || !paymentReceiptUrl.startsWith(`https://res.cloudinary.com/${cloudName}/`)
      || !paymentReceiptUrl.includes("/rawnq/receipts/")) {
      return { ok: false, error: "ارفع إيصال التحويل البنكي أولاً." };
    }
  }
  if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > 50) return { ok: false, error: "السلة فارغة." };

  const items: OrderItem[] = [];
  for (const line of input.lines) {
    if (!line || typeof line !== "object" || typeof line.slug !== "string") return { ok: false, error: "أحد المنتجات غير صالح." };
    const qty = Number(line.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return { ok: false, error: "كمية غير صحيحة." };
    const slug = clean(line.slug, 160);
    const option = clean(line.option, 100);
    const product = await getProduct(slug);
    if (!product) return { ok: false, error: "أحد المنتجات لم يعد متوفراً." };

    let stock = product.stock;
    let unitPrice = product.price;
    if (product.variants.length) {
      const variant = product.variants.find((v) => [v.color, v.size].filter(Boolean).join(" / ") === option);
      if (!variant) return { ok: false, error: `اختر خيارات ${product.name}.` };
      stock = variant.stock;
      unitPrice = variant.price ?? product.price;
    } else if (option) {
      return { ok: false, error: `خيارات ${product.name} غير صالحة.` };
    }
    if (stock < qty) return { ok: false, error: `الكمية المطلوبة من ${product.name} غير متوفرة.` };
    items.push({ slug: product.slug, name: product.name, image: product.image, option: option || undefined, qty, unitPrice });
  }

  const subtotal = items.reduce((n, i) => n + i.qty * i.unitPrice, 0);
  const shipping = deliveryArea.fee;
  const createdAt = new Date().toISOString();
  const order: OrderSummary = {
    orderNumber: newOrderNumber(),
    createdAt,
    status: "NEW", statusHistory: [{ status: "NEW", createdAt }],
    customer, payment: input.payment, deliveryAreaName: deliveryArea.name,
    paymentReceiptUrl: input.payment === "bank" ? paymentReceiptUrl : undefined, items,
    subtotal, shipping, total: subtotal + shipping,
  };
  const customerUserId = session?.user?.role === "CUSTOMER" ? session.user.id : undefined;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await commitOrder(order, customerUserId);
      let deliverySent = false;
      try {
        const shipment = await sendBestRouteOrder(order.orderNumber, { allowUnconfirmedBankPayment: true });
        deliverySent = shipment.ok;
        if (!shipment.ok) console.error(`Best Route auto-send failed for ${order.orderNumber}: ${shipment.error}`);
      } catch (error) {
        console.error(`Could not submit order ${order.orderNumber} to Best Route.`, error);
      }
      return { ok: true, order, deliverySent };
    } catch (error) {
      // The public order number is short for readability; retry the rare unique-key collision.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 4) {
        order.orderNumber = newOrderNumber();
        continue;
      }
      if (error instanceof OrderCommitError) {
        return { ok: false, error: error.code === "STOCK_CHANGED"
          ? "تغير المخزون أثناء إتمام الطلب. حدّث السلة وحاول مجدداً."
          : "أحد المنتجات تغير أو لم يعد متوفراً. حدّث السلة وحاول مجدداً." };
      }
      throw error;
    }
  }
  throw new Error("Could not allocate a unique order number after five attempts.");
}
