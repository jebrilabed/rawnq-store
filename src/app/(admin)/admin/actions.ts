"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as admin from "@/lib/data/admin";
import { db } from "@/lib/data/db";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Variant } from "@/lib/types";

const text = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);
const num = (f: FormData, k: string) => { const v = text(f, k, 20); return v === "" ? NaN : Number(v); };
const refresh = () => revalidatePath("/", "layout");
const fail = (path: string, msg: string): never => redirect(`${path}?error=${encodeURIComponent(msg)}`);

function parseVariants(raw: string): Variant[] | string {
  let rows: unknown;
  try { rows = JSON.parse(raw || "[]"); } catch { return "بيانات الخيارات غير صالحة."; }
  if (!Array.isArray(rows) || rows.length > 100) return "بيانات الخيارات غير صالحة.";
  const seen = new Set<string>(); const out: Variant[] = [];
  for (const r of rows as Record<string, unknown>[]) {
    const color = String(r.color ?? "").trim().slice(0, 40) || undefined;
    const size = String(r.size ?? "").trim().slice(0, 40) || undefined;
    if (!color && !size) continue;
    const stock = Number(r.stock ?? 0);
    const price = r.price === "" || r.price == null ? undefined : Number(r.price);
    if (!Number.isInteger(stock) || stock < 0 || (price !== undefined && !(price > 0))) return "تحقق من كميات وأسعار الخيارات.";
    const key = `${color}|${size}`;
    if (seen.has(key)) return "تركيبة لون/حجم مكررة.";
    seen.add(key); out.push({ color, size, stock, price });
  }
  return out;
}

export async function saveProductAction(f: FormData) {
  await requireAdmin();
  const id = text(f, "id", 80) || undefined;
  const back = id ? `/admin/products/${id}` : "/admin/products/new";
  const variants = parseVariants(text(f, "variants", 20000));
  if (typeof variants === "string") return fail(back, variants);
  const stock = num(f, "stock");
  const compare = num(f, "comparePrice");
  const err = admin.saveProduct({
    id, name: text(f, "name", 120), description: text(f, "description", 1000), categorySlug: text(f, "categorySlug", 80),
    price: num(f, "price"), comparePrice: Number.isFinite(compare) && compare > 0 ? compare : undefined,
    stock: Number.isInteger(stock) && stock >= 0 ? stock : 0, image: text(f, "image", 500), published: f.get("published") === "on", variants,
  });
  if (err) return fail(back, err);
  refresh(); redirect("/admin/products");
}
export async function togglePublishedAction(f: FormData) { await requireAdmin(); admin.togglePublished(text(f, "id", 80)); refresh(); }
export async function deleteProductAction(f: FormData) { await requireAdmin(); admin.deleteProduct(text(f, "id", 80)); refresh(); }

export async function addCategoryAction(f: FormData) {
  await requireAdmin();
  const err = admin.addCategory(text(f, "name", 60)); if (err) return fail("/admin/categories", err);
  refresh(); redirect("/admin/categories");
}
export async function renameCategoryAction(f: FormData) {
  await requireAdmin();
  const err = admin.renameCategory(text(f, "slug", 80), text(f, "name", 60)); if (err) return fail("/admin/categories", err);
  refresh(); redirect("/admin/categories");
}
export async function deleteCategoryAction(f: FormData) {
  await requireAdmin();
  const err = admin.deleteCategory(text(f, "slug", 80)); if (err) return fail("/admin/categories", err);
  refresh(); redirect("/admin/categories");
}

export async function updateOrderStatusAction(orderNumber: string, status: string) {
  await requireAdmin();
  if (!(status in STATUS_LABEL)) return;
  admin.setOrderStatus(orderNumber, status as OrderStatus);
  revalidatePath("/admin", "layout");
}

export async function updateStockAction(f: FormData) {
  await requireAdmin();
  const vi = text(f, "variant", 5);
  admin.setStock(text(f, "id", 80), vi === "" ? null : Number(vi), num(f, "qty"));
  refresh();
}

export async function saveSettingsAction(f: FormData) {
  await requireAdmin();
  const fee = num(f, "shippingFee"), low = num(f, "lowStockThreshold"), free = num(f, "freeShippingFrom");
  if (!(fee >= 0)) return fail("/admin/settings", "رسوم الشحن غير صحيحة.");
  if (f.get("cod") !== "on" && f.get("bank") !== "on") return fail("/admin/settings", "فعّل طريقة دفع واحدة على الأقل.");
  admin.saveSettings({
    storeName: text(f, "storeName", 80), phone: text(f, "phone", 30), whatsapp: text(f, "whatsapp", 30), instagram: text(f, "instagram", 60),
    shippingFee: fee, freeShippingFrom: free > 0 ? free : null, cod: f.get("cod") === "on", bank: f.get("bank") === "on",
    bankDetails: text(f, "bankDetails", 500), lowStockThreshold: Number.isInteger(low) && low >= 0 ? low : db.settings.lowStockThreshold,
  });
  refresh(); redirect("/admin/settings?saved=1");
}

export async function saveContentAction(f: FormData) {
  await requireAdmin();
  const q = f.getAll("q").map((x) => String(x).trim().slice(0, 200)), a = f.getAll("a").map((x) => String(x).trim().slice(0, 1000));
  admin.saveContent({
    about: text(f, "about", 3000), delivery: text(f, "delivery", 3000),
    faq: q.map((x, i) => [x, a[i] ?? ""] as [string, string]).filter(([x, y]) => x && y),
  });
  refresh(); redirect("/admin/content?saved=1");
}
