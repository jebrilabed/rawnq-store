import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const prompt = createInterface({ input: stdin, output: stdout });

try {
  const currentEmail = (await prompt.question("Current email: ")).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail)) throw new Error("Enter a valid email address.");

  const user = await prisma.adminUser.findUnique({ where: { email: currentEmail } });
  if (!user) throw new Error(`No account found for ${currentEmail}.`);
  console.log(`Found account: ${currentEmail} (role: ${user.role})`);

  const newEmail = (await prompt.question("New email: ")).trim().toLowerCase();
  prompt.close();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) throw new Error("Enter a valid new email address.");
  if (newEmail === currentEmail) throw new Error("New email must be different from current email.");

  const existing = await prisma.adminUser.findUnique({ where: { email: newEmail } });
  if (existing) throw new Error(`An account with email ${newEmail} already exists.`);

  await prisma.adminUser.update({ where: { email: currentEmail }, data: { email: newEmail } });
  console.log(`Email successfully updated from ${currentEmail} to ${newEmail}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not update email.");
  process.exitCode = 1;
} finally {
  prompt.close();
  await prisma.$disconnect();
}

