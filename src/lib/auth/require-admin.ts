import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/data/prisma";

/**
 * بوابة لوحة التحكم. استدعِها في layout لوحة التحكم وفي كل Server Action.
 */
export async function requireAdmin() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || session.user.role !== "ADMIN") redirect("/ar/login?next=admin");
  const user = await prisma.adminUser.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/ar/login?next=admin");
}
