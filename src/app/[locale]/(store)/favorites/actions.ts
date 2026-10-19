"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/data/prisma";

export async function setFavoriteAction(productId: string, selected: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  const customerUserId = session?.user?.role === "CUSTOMER" ? session.user.id : undefined;
  if (!customerUserId) return { ok: false, error: "سجّل الدخول لحفظ المفضلة في حسابك." };
  if (typeof productId !== "string" || productId.length < 1 || productId.length > 100 || typeof selected !== "boolean") {
    return { ok: false, error: "بيانات المفضلة غير صالحة." };
  }
  if (selected) {
    const product = await prisma.product.findFirst({ where: { id: productId, published: true }, select: { id: true } });
    if (!product) return { ok: false, error: "المنتج غير متاح." };
    await prisma.favoriteProduct.upsert({
      where: { customerUserId_productId: { customerUserId, productId } },
      create: { customerUserId, productId },
      update: {},
    });
  } else {
    await prisma.favoriteProduct.deleteMany({ where: { customerUserId, productId } });
  }
  return { ok: true };
}
