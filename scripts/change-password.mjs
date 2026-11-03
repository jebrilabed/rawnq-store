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
  const email = (await prompt.question("Email: ")).trim().toLowerCase();
  prompt.close();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) throw new Error(`No account found for ${email}.`);
  console.log(`Found account: ${email} (role: ${user.role})`);
  const newPassword = await readHidden("New password (8 to 128 characters, hidden): ");
  if (newPassword.length < 8 || newPassword.length > 128) throw new Error("Use a password between 8 and 128 characters.");
  const confirmation = await readHidden("Confirm new password (hidden): ");
  if (newPassword !== confirmation) throw new Error("Passwords do not match.");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(newPassword, salt, 64).toString("hex");
  await prisma.adminUser.update({ where: { email }, data: { passwordHash: `scrypt$${salt}$${hash}` } });
  console.log(`Password updated successfully for ${email}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not update password.");
  process.exitCode = 1;
} finally {
  prompt.close();
  await prisma.$disconnect();
}
