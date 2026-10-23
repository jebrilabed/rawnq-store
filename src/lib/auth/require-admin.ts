import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * بوابة لوحة التحكم. استدعِها في layout لوحة التحكم وفي كل Server Action.
 * نعتمد على JWT المُوقَّع بدل استعلام DB إضافي — الـ role محفوظ بأمان في التوكن.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/ar/login?next=admin");
}
