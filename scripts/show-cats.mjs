import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const cats = await prisma.category.findMany({
    orderBy: { slug: "asc" },
  });
  console.log(`Total categories: ${cats.length}`);
  for (const c of cats) {
    console.log(`slug: ${c.slug} | name: ${c.name} | parentSlug: ${c.parentSlug}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
