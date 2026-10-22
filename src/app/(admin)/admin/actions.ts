"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import * as admin from "@/lib/data/admin";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Variant } from "@/lib/types";
import { uploadProductImage } from "@/lib/data/cloudinary";
import { checkBestRouteConnection } from "@/lib/integrations/best-route";
import { sendBestRouteOrder } from "@/lib/integrations/best-route-orders";
import { saveStoreContent } from "@/lib/data/db";

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
  const currentImage = text(f, "image", 500);
  const imageFile = f.get("productImage");
  if (imageFile && typeof imageFile !== "string" && imageFile.size) {
    if (!["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"].includes(imageFile.type) || imageFile.size > 5 * 1024 * 1024) {
      return fail(back, "الصورة يجب أن تكون JPEG أو PNG أو WebP أو GIF أو AVIF وأقل من 5 ميغابايت.");
    }
  } else if (!currentImage) {
    return fail(back, "اختر صورة المنتج من جهازك أولاً.");
  }
  const stock = hasVariants ? variants.reduce((sum, variant) => sum + variant.stock, 0) : num(f, "stock");
  if (!Number.isInteger(stock) || stock < 0 || stock > 2_147_483_647) return fail(back, "كمية المخزون غير صحيحة.");
  const price = hasVariants ? Math.min(...variants.map((variant) => variant.price as number)) : num(f, "price");
  const compare = hasVariants ? NaN : num(f, "comparePrice");
  if (!hasVariants && text(f, "comparePrice", 20) && (!Number.isFinite(compare) || compare <= 0 || compare > 99_999_999.99)) return fail(back, "سعر المقارنة غير صحيح.");
  let image = currentImage;
  if (imageFile && typeof imageFile !== "string" && imageFile.size) {
    try {
      image = await uploadProductImage(imageFile);
    } catch (error) {
      console.error("Failed to upload product image.", error);
      return fail(back, "تعذر رفع الصورة. تحقق من إعدادات التخزين وحاول مرة أخرى.");
    }
  }
  const err = await admin.saveProduct({
    id, name: text(f, "name", 120), description: text(f, "description", 1000),
    translations: {
      en: text(f, "name_en", 120), he: text(f, "name_he", 120), ru: text(f, "name_ru", 120),
      en_description: text(f, "description_en", 1000), he_description: text(f, "description_he", 1000),
      ru_description: text(f, "description_ru", 1000),
    },
    categorySlug: text(f, "categorySlug", 80),
    price, comparePrice: !hasVariants && Number.isFinite(compare) && compare > 0 ? compare : undefined,
    stock, image, published: f.get("published") === "on", variants,
  });
  if (err) return fail(back, err);
  refresh(); redirect("/admin/products");
}
export async function togglePublishedAction(f: FormData) { await requireAdmin(); await admin.togglePublished(text(f, "id", 80)); refresh(); }
export async function deleteProductAction(f: FormData) { await requireAdmin(); await admin.deleteProduct(text(f, "id", 80)); refresh(); }

export async function adminLogoutAction() { await signOut({ redirectTo: "/ar/login" }); }

export async function addCategoryAction(f: FormData) {
  await requireAdmin();
  const err = await admin.addCategory(text(f, "name", 60), { en: text(f, "name_en", 60), he: text(f, "name_he", 60), ru: text(f, "name_ru", 60) }); if (err) return fail("/admin/categories", err);
  refresh(); redirect("/admin/categories");
}
export async function renameCategoryAction(f: FormData) {
  await requireAdmin();
  const err = await admin.renameCategory(text(f, "slug", 80), text(f, "name", 60), { en: text(f, "name_en", 60), he: text(f, "name_he", 60), ru: text(f, "name_ru", 60) }); if (err) return fail("/admin/categories", err);
  refresh(); redirect("/admin/categories");
}
export async function deleteCategoryAction(f: FormData) {
  await requireAdmin();
  const err = await admin.deleteCategory(text(f, "slug", 80)); if (err) return fail("/admin/categories", err);
  refresh(); redirect("/admin/categories");
}

export async function saveStoreContentAction(f: FormData) {
  await requireAdmin();
  const faqCount = num(f, "faqCount");
  if (faqCount < 1 || faqCount > 20) return fail("/admin/content", "أضف سؤالاً واحداً على الأقل وبحد أقصى 20 سؤالاً.");
  const faqFor = (locale: string) => Array.from({ length: faqCount }, (_, index) => [
    text(f, `${locale}_faq_q_${index}`, 300),
    text(f, `${locale}_faq_a_${index}`, 2000),
  ] as [string, string]);
  const arabicFaq = faqFor("ar");
  if (arabicFaq.some(([question, answer]) => !question || !answer)) return fail("/admin/content", "أكمل جميع الأسئلة والأجوبة العربية.");
  const translations: Record<string, { about: string; delivery: string; faq: [string, string][] }> = {};
  for (const locale of ["en", "he", "ru"]) {
    const faq = faqFor(locale);
    translations[locale] = {
      about: text(f, `${locale}_about`, 5000),
      delivery: text(f, `${locale}_delivery`, 5000),
      faq: faq.every(([question, answer]) => question && answer) ? faq : [],
    };
  }
  await saveStoreContent({
    about: text(f, "ar_about", 5000),
    delivery: text(f, "ar_delivery", 5000),
    faq: arabicFaq,
    translations,
  });
  refresh();
  redirect("/admin/content?saved=1");
}

export async function updateOrderStatusAction(orderNumber: string, status: string) {
  await requireAdmin();
  if (!Object.prototype.hasOwnProperty.call(STATUS_LABEL, status)) return;
  await admin.setOrderStatus(orderNumber, status as OrderStatus);
  revalidatePath("/admin", "layout");
}

export async function checkBestRouteConnectionAction() {
  await requireAdmin();
  return checkBestRouteConnection();
}

export async function sendBestRouteOrderAction(orderNumber: string, bankPaymentConfirmed: boolean) {
  await requireAdmin();
  const result = await sendBestRouteOrder(orderNumber, { bankPaymentConfirmed });
  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath("/admin/orders");
  return result;
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
  const localizedNames = {
    en: f.getAll("areaName_en"),
    he: f.getAll("areaName_he"),
    ru: f.getAll("areaName_ru"),
  };
  if (names.length < 1 || names.length > 50 || names.length !== fees.length) return fail("/admin/settings", "أضف منطقة توصيل واحدة على الأقل.");
  if (Object.values(localizedNames).some((values) => values.length !== names.length)) return fail("/admin/settings", "تحقق من ترجمات أسماء مناطق التوصيل.");
  const areaNames = new Set<string>();
  const deliveryAreas = names.map((value, index) => {
    const name = String(value).trim().slice(0, 80);
    const fee = Number(fees[index]);
    const normalizedName = name.toLocaleLowerCase();
    if (name.length < 2 || areaNames.has(normalizedName) || !validMoney(fee, true)) return null;
    areaNames.add(normalizedName);
    const translations = Object.fromEntries(Object.entries(localizedNames).map(([locale, values]) => [
      locale, String(values[index] ?? "").trim().slice(0, 80),
    ]));
    return { id: `area-${index}`, value: name, name, fee, translations: JSON.stringify(translations) };
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
    lowStockThreshold: low, deliveryAreas: deliveryAreas as { id: string; value: string; name: string; fee: number; translations: string }[],
  });
  refresh(); redirect("/admin/settings?saved=1");
}
