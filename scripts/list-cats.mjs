import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: [{ parentSlug: "asc" }, { slug: "asc" }]
  });
  console.log(`TOTAL CATEGORIES: ${categories.length}`);
  for (const c of categories) {
    console.log(`${c.slug} | ${c.parentSlug || "ROOT"} | ${c.name}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
