import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: [{ parentSlug: "asc" }, { slug: "asc" }]
  });
  
  const rootCats = categories.filter(c => !c.parentSlug);
  const subCats = categories.filter(c => !!c.parentSlug);

  console.log(`=== ROOT CATEGORIES (${rootCats.length}) ===`);
  for (const r of rootCats) {
    const childrenCount = subCats.filter(s => s.parentSlug === r.slug).length;
    console.log(`${r.slug}: ${r.name} (${childrenCount} subcategories)`);
  }

  console.log(`\n=== SUBCATEGORIES BY PARENT ===`);
  for (const r of rootCats) {
    const children = subCats.filter(s => s.parentSlug === r.slug);
    if (children.length) {
      console.log(`\nParent: ${r.name} (${r.slug})`);
      for (const c of children) {
        console.log(`  - ${c.slug}: ${c.name}`);
        // Check if this child itself has children
        const grandChildren = subCats.filter(s => s.parentSlug === c.slug);
        for (const gc of grandChildren) {
          console.log(`      * ${gc.slug}: ${gc.name}`);
        }
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
