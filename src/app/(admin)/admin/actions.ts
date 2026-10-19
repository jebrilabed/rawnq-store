"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import * as admin from "@/lib/data/admin";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Variant } from "@/lib/types";
import { uploadProductImage } from "@/lib/data/cloudinary";

const text = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);
const num = (f: FormData, k: string) => { const v = text(f, k, 20); return v === "" ? NaN : Number(v); };
const refresh = () => revalidatePath("/", "layout");
const fail = (path: string, msg: string): never => redirect(`${path}?error=${encodeURIComponent(msg)}`);

function parseVariants(raw: string): Variant[] | string {
  let rows: unknown;
  try { rows = JSON.parse(raw || "[]"); } catch { return "بيانات الخيارات غير صالحة."; }
  if (!Array.isArray(rows) || rows.length > 100) return "بيانات الخيارات غير صالحة.";
  const seen = new Set<string>(); const out: Variant[] = [];
  for (const value of rows) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "بيانات الخيارات غير صالحة.";
    const r = value as Record<string, unknown>;
    const color = String(r.color ?? "").trim().slice(0, 40) || undefined;
    const size = String(r.size ?? "").trim().slice(0, 40) || undefined;
    if (!color && !size) continue;
    const stock = Number(r.stock ?? 0);
    const price = r.price === "" || r.price == null ? undefined : Number(r.price);
    if (!Number.isInteger(stock) || stock < 0 || stock > 2_147_483_647 || (price !== undefined && (!Number.isFinite(price) || !(price > 0) || price > 99_999_999.99))) return "تحقق من كميات وأسعار الخيارات.";
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
  const hasVariants = f.get("hasVariants") === "on";
  const variants = parseVariants(text(f, "variants", 20000));
  if (typeof variants === "string") return fail(back, variants);
  if (hasVariants && variants.length === 0) return fail(back, "أضف لوناً أو حجماً واحداً على الأقل.");
  if (hasVariants && variants.some((variant) => variant.price == null)) return fail(back, "أدخل سعر كل خيار في الجدول.");
  const stock = hasVariants ? variants.reduce((sum, variant) => sum + variant.stock, 0) : num(f, "stock");
  if (!Number.isInteger(stock) || stock < 0 || stock > 2_147_483_647) return fail(back, "كمية المخزون غير صحيحة.");
  const price = hasVariants ? Math.min(...variants.map((variant) => variant.price as number)) : num(f, "price");
  const compare = hasVariants ? NaN : num(f, "comparePrice");
  if (!hasVariants && text(f, "comparePrice", 20) && (!Number.isFinite(compare) || compare <= 0 || compare > 99_999_999.99)) return fail(back, "سعر المقارنة غير صحيح.");
  const err = await admin.saveProduct({
    id, name: text(f, "name", 120), description: text(f, "description", 1000), categorySlug: text(f, "categorySlug", 80),
    price, comparePrice: !hasVariants && Number.isFinite(compare) && compare > 0 ? compare : undefined,
    stock, image: text(f, "image", 500), published: f.get("published") === "on", variants,
  });
  if (err) return fail(back, err);
  refresh(); redirect("/admin/products");
}
export async function togglePublishedAction(f: FormData) { await requireAdmin(); await admin.togglePublished(text(f, "id", 80)); refresh(); }
export async function deleteProductAction(f: FormData) { await requireAdmin(); await admin.deleteProduct(text(f, "id", 80)); refresh(); }

export async function uploadProductImageAction(f: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();
  const file = f.get("image");
  if (!file || typeof file === "string" || !file.size) return { ok: false, error: "اختر صورة أولاً." };
  if (!["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) return { ok: false, error: "الصورة يجب أن تكون JPEG أو PNG أو WebP أو GIF أو AVIF وأقل من 5 ميغابايت." };
  try { return { ok: true, url: await uploadProductImage(file) }; }
  catch { return { ok: false, error: "تعذر رفع الصورة إلى Cloudinary." }; }
}

export async function adminLogoutAction() { await signOut({ redirectTo: "/ar/login" }); }

export async function addCategoryAction(f: FormData) {
  await requireAdmin();
  const err = await admin.addCategory(text(f, "name", 60)); if (err) return fail("/admin/categories", err);
  refresh(); redirect("/admin/categories");
}
export async function renameCategoryAction(f: FormData) {
  await requireAdmin();
  const err = await admin.renameCategory(text(f, "slug", 80), text(f, "name", 60)); if (err) return fail("/admin/categories", err);
  refresh(); redirect("/admin/categories");
}
export async function deleteCategoryAction(f: FormData) {
  await requireAdmin();
  const err = await admin.deleteCategory(text(f, "slug", 80)); if (err) return fail("/admin/categories", err);
  refresh(); redirect("/admin/categories");
}

export async function updateOrderStatusAction(orderNumber: string, status: string) {
  await requireAdmin();
  if (!Object.prototype.hasOwnProperty.call(STATUS_LABEL, status)) return;
  await admin.setOrderStatus(orderNumber, status as OrderStatus);
  revalidatePath("/admin", "layout");
}

export async function updateStockAction(f: FormData) {
  await requireAdmin();
  const vi = text(f, "variant", 80);
  const qty = num(f, "qty");
  if (!Number.isInteger(qty) || qty < 0 || qty > 2_147_483_647) return;
  await admin.setStock(text(f, "id", 80), vi === "" ? null : vi, qty);
  refresh();
}

export async function saveSettingsAction(f: FormData) {
  await requireAdmin();
  const low = num(f, "lowStockThreshold");
  const validMoney = (value: number, allowZero = false) => Number.isFinite(value) && value <= 99_999_999.99 && (allowZero ? value >= 0 : value > 0);
  if (!Number.isInteger(low) || low < 0 || low > 2_147_483_647) return fail("/admin/settings", "حد تنبيه المخزون غير صحيح.");
  if (f.get("cod") !== "on" && f.get("bank") !== "on") return fail("/admin/settings", "فعّل طريقة دفع واحدة على الأقل.");
  const names = f.getAll("areaName");
  const fees = f.getAll("areaFee");
  if (names.length < 1 || names.length > 50 || names.length !== fees.length) return fail("/admin/settings", "أضف منطقة توصيل واحدة على الأقل.");
  const areaNames = new Set<string>();
  const deliveryAreas = names.map((value, index) => {
    const name = String(value).trim().slice(0, 80);
    const fee = Number(fees[index]);
    const normalizedName = name.toLocaleLowerCase();
    if (name.length < 2 || areaNames.has(normalizedName) || !validMoney(fee, true)) return null;
    areaNames.add(normalizedName);
    return { id: `area-${index}`, name, fee };
  });
  if (deliveryAreas.some((area) => area === null)) return fail("/admin/settings", "تحقق من أسماء المناطق ورسوم التوصيل، وتجنب تكرار المنطقة.");
  const phone = text(f, "phone", 30);
  const bankAccountName = text(f, "bankAccountName", 120);
  const bankIban = text(f, "bankIban", 40).replace(/\s/g, "").toUpperCase();
  const bankAccountNumber = text(f, "bankAccountNumber", 34).replace(/\s/g, "");
  const bankEnabled = f.get("bank") === "on";
  if (bankEnabled && (bankAccountName.length < 2 || !/^[A-Z0-9]{15,34}$/.test(bankIban) || !/^[A-Z0-9-]{4,34}$/i.test(bankAccountNumber))) {
    return fail("/admin/settings", "أدخل اسم صاحب الحساب والآيبان ورقم الحساب بشكل صحيح لإتاحة التحويل البنكي.");
  }
  const bankDetails = [
    bankAccountName && `اسم صاحب الحساب: ${bankAccountName}`,
    bankIban && `الآيبان (IBAN): ${bankIban}`,
    bankAccountNumber && `رقم الحساب: ${bankAccountNumber}`,
  ].filter(Boolean).join("\n");
  await admin.saveSettings({
    storeName: text(f, "storeName", 80), phone, whatsapp: phone, instagram: text(f, "instagram", 60),
    shippingFee: deliveryAreas[0]!.fee, freeShippingFrom: null, cod: f.get("cod") === "on", bank: bankEnabled,
    bankDetails, bankAccountName, bankIban, bankAccountNumber,
    lowStockThreshold: low, deliveryAreas: deliveryAreas as { id: string; name: string; fee: number }[],
  });
  refresh(); redirect("/admin/settings?saved=1");
}


