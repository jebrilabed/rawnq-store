import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * بوابة المصادقة للموظفين وأصحاب المتجر.
 * تسمح بدخول أصحاب دور ADMIN أو WORKER.
 */
export async function requireStaffOrAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/ar/login?next=admin");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "WORKER") redirect("/ar/login?next=admin");
  return session;
}

/**
 * بوابة صاحب المتجر حصراً (ADMIN).
 * إذا كان المستخدم عاملاً (WORKER) يتم تحويله مباشرة لصفحة المنتجات.
 */
export async function requireAdmin() {
  const session = await requireStaffOrAdmin();
  if (session.user.role !== "ADMIN") {
    redirect("/admin/products");
  }
  return session;
}
