import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY) return reject(new Error("Run this command in an interactive terminal."));
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    let value = "";
    const finish = (result) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      stdout.write("\n");
      resolve(result);
    };
    const onData = (buffer) => {
      for (const byte of buffer) {
        if (byte === 3) { stdin.setRawMode(false); stdin.pause(); reject(new Error("Cancelled.")); return; }
        if (byte === 13 || byte === 10) { finish(value); return; }
        if (byte === 8 || byte === 127) value = value.slice(0, -1);
        else if (byte >= 32) value += String.fromCharCode(byte);
      }
    };
    stdin.on("data", onData);
  });
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const prompt = createInterface({ input: stdin, output: stdout });

try {
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET must be set in .env before creating an admin.");
  const email = (await prompt.question("Admin email: ")).trim().toLowerCase();
  prompt.close();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (await prisma.adminUser.findUnique({ where: { email } })) throw new Error("An account with this email already exists; no changes were made.");
  const password = await readHidden("Admin password (8 to 128 characters, hidden): ");
  if (password.length < 8 || password.length > 128) throw new Error("Use a password between 8 and 128 characters.");
  const confirmation = await readHidden("Confirm password (hidden): ");
  if (password !== confirmation) throw new Error("Passwords do not match.");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  await prisma.adminUser.create({ data: { email, passwordHash: `scrypt$${salt}$${hash}`, role: "ADMIN" } });
  console.log(`Admin account created for ${email}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not create admin account.");
  process.exitCode = 1;
} finally {
  prompt.close();
  await prisma.$disconnect();
}
