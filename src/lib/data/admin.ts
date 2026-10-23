import type { Product, Variant } from "@/lib/types";
import type { CustomerOrderListItem, OrderStatus, OrderSummary } from "@/lib/orders";
import { prisma } from "./prisma";
import { getSettings, type Settings, saveSettings as persistSettings } from "./db";

export const stockOf = (product: { stock: number; variants: { stock: number }[] }) => product.variants.length ? product.variants.reduce((total, variant) => total + variant.stock, 0) : product.stock;

function toOrder(row: { orderNumber: string; createdAt: Date; status: string; customerName: string; phone: string; city: string; address: string; notes: string | null; payment: string; deliveryAreaName: string | null; paymentReceiptUrl: string | null; subtotal: { toNumber(): number }; shipping: { toNumber(): number }; total: { toNumber(): number }; items: { slug: string; name: string; image: string; option: string | null; qty: number; unitPrice: { toNumber(): number } }[]; statusHistory: { status: string; createdAt: Date }[] }): OrderSummary {
  return {
    orderNumber: row.orderNumber, createdAt: row.createdAt.toISOString(), status: row.status as OrderStatus,
    customer: { name: row.customerName, phone: row.phone, city: row.city, address: row.address, notes: row.notes ?? undefined },
    payment: row.payment as "cod" | "bank", deliveryAreaName: row.deliveryAreaName ?? undefined,
    paymentReceiptUrl: row.paymentReceiptUrl ?? undefined,
    statusHistory: row.statusHistory.map((entry) => ({ status: entry.status as OrderStatus, createdAt: entry.createdAt.toISOString() })),
    items: row.items.map((item) => ({ slug: item.slug, name: item.name, image: item.image, option: item.option ?? undefined, qty: item.qty, unitPrice: item.unitPrice.toNumber() })),
    subtotal: row.subtotal.toNumber(), shipping: row.shipping.toNumber(), total: row.total.toNumber(),
  };
}

export async function stats() {
  const [products, orders, settings, productRows, sales] = await Promise.all([
    prisma.product.count(), prisma.storeOrder.count(), getSettings(), prisma.product.findMany({ select: { stock: true, variants: { select: { stock: true } } } }),
    prisma.storeOrder.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true } }),
  ]);
  const low = productRows.filter((product) => stockOf(product) <= settings.lowStockThreshold).length;
  return { products, orders, low, sales: Number(sales._sum.total ?? 0) };
}

export async function getAdminProducts() {
  return prisma.product.findMany({
    select: {
      id: true, name: true, image: true, price: true, stock: true, published: true,
      category: { select: { name: true } },
      variants: { select: { stock: true } },
    },
    orderBy: { createdAt: "desc" },
  }).then((rows) => rows.map((row) => ({ ...row, price: Number(row.price) })));
}

export async function getInventoryProducts() {
  return prisma.product.findMany({
    select: {
      id: true, name: true, image: true, stock: true,
      variants: { select: { id: true, color: true, size: true, stock: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryRows() {
  return prisma.category.findMany({
    include: {
      parent: { select: { name: true } },
      _count: { select: { products: true, children: true } },
    },
    orderBy: [{ parentSlug: "asc" }, { name: "asc" }],
  });
}

export type OrderListRow = { orderNumber: string; status: OrderStatus; customerName: string; total: number; image: string };

export async function getOrders(): Promise<OrderListRow[]> {
  const rows = await prisma.storeOrder.findMany({
    select: { orderNumber: true, status: true, customerName: true, total: true, items: { take: 1, select: { image: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    orderNumber: row.orderNumber, status: row.status as OrderStatus, customerName: row.customerName,
    total: Number(row.total), image: row.items[0]?.image ?? "/brand/logo.png",
  }));
}

export async function getRecentOrders(take = 5): Promise<OrderListRow[]> {
  const rows = await prisma.storeOrder.findMany({
    select: { orderNumber: true, status: true, customerName: true, total: true, items: { take: 1, select: { image: true } } },
    orderBy: { createdAt: "desc" }, take: Math.max(1, Math.min(50, Math.trunc(take))),
  });
  return rows.map((row) => ({
    orderNumber: row.orderNumber, status: row.status as OrderStatus, customerName: row.customerName,
    total: Number(row.total), image: row.items[0]?.image ?? "/brand/logo.png",
  }));
}

export async function getOrder(orderNumber: string) {
  const row = await prisma.storeOrder.findUnique({
    where: { orderNumber },
    include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
  });
  return row ? toOrder(row) : undefined;
}

export async function getBestRouteShipment(orderNumber: string) {
  const row = await prisma.storeOrder.findUnique({
    where: { orderNumber },
    select: { bestRouteState: true, bestRouteOrderId: true, bestRouteError: true, bestRouteUpdatedAt: true },
  });
  return row ? {
    state: row.bestRouteState,
    orderId: row.bestRouteOrderId ?? undefined,
    error: row.bestRouteError ?? undefined,
    updatedAt: row.bestRouteUpdatedAt?.toISOString(),
  } : undefined;
}

export async function getCustomerOrders(customerUserId: string): Promise<CustomerOrderListItem[]> {
  const rows = await prisma.storeOrder.findMany({
    where: { customerUserId },
    select: {
      orderNumber: true, createdAt: true, status: true, total: true,
      _count: { select: { items: true } }, items: { take: 1, select: { image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    orderNumber: row.orderNumber, createdAt: row.createdAt.toISOString(), status: row.status as OrderStatus,
    itemCount: row._count.items, image: row.items[0]?.image ?? "/brand/logo.png", total: Number(row.total),
  }));
}

export async function getCustomerOrder(customerUserId: string, orderNumber: string) {
  const row = await prisma.storeOrder.findFirst({
    where: { customerUserId, orderNumber },
    include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
  });
  return row ? toOrder(row) : undefined;
}

export type ProductInput = {
  id?: string; name: string; description: string; categorySlug: string; price: number; comparePrice?: number;
  translations?: Record<string, string>;
  stock: number; image: string; published: boolean; variants: Variant[];
};

const slugify = (value: string, fallback: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
const MAX_PRICE = 99_999_999.99;
const isMoney = (value: number, allowZero = false) => Number.isFinite(value)
  && value <= MAX_PRICE
  && (allowZero ? value >= 0 : value > 0)
  && Math.abs(value * 100 - Math.round(value * 100)) < 1e-8;

function isSafeProductImage(image: string) {
  if (image.startsWith("/") && !image.startsWith("//") && !image.includes("\\") && !/[\u0000-\u001f]/.test(image)) return true;
  try {
    const url = new URL(image);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export async function saveProduct(input: ProductInput): Promise<string | null> {
  if (input.name.length < 2) return "أدخل اسم المنتج.";
  if (!isMoney(input.price)) return "أدخل سعراً صحيحاً.";
  if (input.comparePrice != null && !isMoney(input.comparePrice)) return "سعر المقارنة غير صحيح.";
  if (!Number.isInteger(input.stock) || input.stock < 0 || input.stock > 2_147_483_647) return "كمية المخزون غير صحيحة.";
  if (input.variants.some((variant) => !Number.isInteger(variant.stock) || variant.stock < 0 || variant.stock > 2_147_483_647 || (variant.price != null && !isMoney(variant.price)))) return "تحقق من كميات وأسعار الخيارات.";
  if (!isSafeProductImage(input.image)) return "رابط الصورة غير صالح. استخدم صورة محلية أو رابط Cloudinary آمن.";
  // Validate category in parallel with slug generation for new products.
  const base = !input.id ? slugify(input.name, "product") : "";
  const [categoryExists, existingSlug] = await Promise.all([
    prisma.category.findUnique({ where: { slug: input.categorySlug }, select: { slug: true } }),
    !input.id ? prisma.product.findUnique({ where: { slug: base }, select: { slug: true } }) : Promise.resolve(null),
  ]);
  if (!categoryExists) return "اختر قسماً. أضف قسماً من صفحة الأقسام أولاً.";
  const data = {
    name: input.name, description: input.description, categorySlug: input.categorySlug,
    translations: JSON.stringify(input.translations ?? {}),
    price: input.price, comparePrice: input.comparePrice ?? null, stock: input.stock,
    image: input.image, published: input.published,
  };
  const variants = input.variants.map((variant) => ({
    color: variant.color ?? null,
    size: variant.size ?? null,
    stock: variant.stock,
    price: variant.price ?? null,
  }));
  if (input.id) {
    await prisma.product.update({
      where: { id: input.id },
      data: { ...data, variants: { deleteMany: {}, create: variants } },
    });
  }
  else {
    let slug = base;
    if (existingSlug) {
      for (let index = 2; await prisma.product.findUnique({ where: { slug } }); index++) slug = `${base}-${index}`;
    }
    await prisma.product.create({ data: { ...data, slug, variants: { create: variants } } });
  }
  return null;
}

export async function deleteProduct(id: string) { await prisma.product.delete({ where: { id } }); }
export async function togglePublished(id: string) {
  // Single atomic round-trip — no prior SELECT needed.
  await prisma.$executeRaw`UPDATE "Product" SET published = NOT published WHERE id = ${id}`;
}

export async function setStock(id: string, variantId: string | null, qty: number) {
  if (!Number.isInteger(qty) || qty < 0) return;
  if (variantId) await prisma.variant.updateMany({ where: { id: variantId, productId: id }, data: { stock: qty } });
  else await prisma.product.updateMany({ where: { id }, data: { stock: qty } });
}

export async function addCategory(name: string, translations: Record<string, string> = {}, parentSlug?: string): Promise<string | null> {
  if (name.length < 2) return "أدخل اسم القسم.";
  // Run existence checks in parallel to save a round-trip.
  const [existing, parent] = await Promise.all([
    prisma.category.findFirst({ where: { name }, select: { slug: true } }),
    parentSlug ? prisma.category.findUnique({ where: { slug: parentSlug }, select: { slug: true } }) : Promise.resolve(null),
  ]);
  if (existing) return "القسم موجود مسبقاً.";
  if (parentSlug && !parent) return "القسم الرئيسي المحدد غير موجود.";
  const base = slugify(name, "category"); let slug = base;
  for (let index = 2; await prisma.category.findUnique({ where: { slug } }); index++) slug = `${base}-${index}`;
  await prisma.category.create({ data: { slug, name, translations: JSON.stringify(translations), parentSlug: parentSlug || null } });
  return null;
}

export async function renameCategory(slug: string, name: string, translations: Record<string, string> = {}): Promise<string | null> {
  if (name.length < 2) return "أدخل اسم القسم.";
  if (await prisma.category.findFirst({ where: { name, slug: { not: slug } } })) return "القسم موجود مسبقاً.";
  await prisma.category.updateMany({ where: { slug }, data: { name, translations: JSON.stringify(translations) } });
  return null;
}

export async function deleteCategory(slug: string): Promise<string | null> {
  // Run both checks in parallel to save a round-trip.
  const [productCount, childCount] = await Promise.all([
    prisma.product.count({ where: { categorySlug: slug } }),
    prisma.category.count({ where: { parentSlug: slug } }),
  ]);
  if (productCount) return "انقل منتجات القسم أولاً.";
  if (childCount) return "احذف الأقسام الفرعية أولاً.";
  await prisma.category.deleteMany({ where: { slug } });
  return null;
}

export async function setOrderStatus(orderNumber: string, status: OrderStatus) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.storeOrder.findUnique({ where: { orderNumber }, select: { id: true, status: true } });
    if (!order || order.status === status) return;
    await tx.storeOrder.update({ where: { id: order.id }, data: { status } });
    await tx.orderStatusHistory.create({ data: { orderId: order.id, status } });
  });
}

export async function saveSettings(settings: Settings) { await persistSettings(settings); }

export async function commitOrder(order: OrderSummary, customerUserId?: string) {
  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const product = await tx.product.findUnique({ where: { slug: item.slug }, include: { variants: true } });
      if (!product?.published) throw new OrderCommitError("CATALOG_CHANGED");
      const variant = product.variants.find((candidate) => [candidate.color, candidate.size].filter(Boolean).join(" / ") === (item.option ?? ""));
      if ((product.variants.length && !variant) || (!product.variants.length && item.option)) throw new OrderCommitError("CATALOG_CHANGED");
      const currentPrice = variant?.price ?? product.price;
      if (currentPrice.toNumber() !== item.unitPrice) throw new OrderCommitError("CATALOG_CHANGED");
      const changed = variant
        ? await tx.variant.updateMany({ where: { id: variant.id, stock: { gte: item.qty } }, data: { stock: { decrement: item.qty } } })
        : await tx.product.updateMany({ where: { id: product.id, stock: { gte: item.qty } }, data: { stock: { decrement: item.qty } } });
      if (changed.count !== 1) throw new OrderCommitError("STOCK_CHANGED");
    }
    await tx.storeOrder.create({ data: {
      orderNumber: order.orderNumber, customerUserId, createdAt: new Date(order.createdAt), status: order.status,
      customerName: order.customer.name, phone: order.customer.phone, city: order.customer.city,
      address: order.customer.address, notes: order.customer.notes, payment: order.payment,
      deliveryAreaName: order.deliveryAreaName, paymentReceiptUrl: order.paymentReceiptUrl,
      subtotal: order.subtotal, shipping: order.shipping, total: order.total,
      items: { create: order.items.map((item) => ({ ...item, option: item.option ?? null })) },
      statusHistory: { create: { status: order.status, createdAt: new Date(order.createdAt) } },
    } });
  });
}

export class OrderCommitError extends Error {
  constructor(readonly code: "STOCK_CHANGED" | "CATALOG_CHANGED") {
    super(code);
    this.name = "OrderCommitError";
  }
}
