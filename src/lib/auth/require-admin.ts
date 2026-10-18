import { redirect } from "next/navigation";

/**
 * بوابة لوحة التحكم. استدعِها في layout لوحة التحكم وفي **كل** Server Action.
 * TODO: اربطها بـ Auth.js: auth() ثم أعد قراءة الدور من قاعدة البيانات (لا تثق بالجلسة وحدها).
 * للأمان: ممنوعة افتراضياً في الإنتاج حتى يتم الربط (أو ALLOW_INSECURE_ADMIN=1 لتجربة مؤقتة فقط).
 */
export async function requireAdmin() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_INSECURE_ADMIN !== "1") redirect("/ar/login");
}
