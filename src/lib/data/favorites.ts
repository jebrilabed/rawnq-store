import { prisma } from "./prisma";

export async function getFavoriteProductIds(customerUserId: string): Promise<string[]> {
  const favorites = await prisma.favoriteProduct.findMany({
    where: { customerUserId, product: { published: true } },
    select: { productId: true },
    orderBy: { createdAt: "desc" },
  });
  return favorites.map((favorite) => favorite.productId);
}
