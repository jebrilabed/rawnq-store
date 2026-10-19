import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { v2 as cloudinary } from "cloudinary";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("PostgreSQL connection: OK");
  await cloudinary.api.ping();
  console.log("Cloudinary connection: OK");
} catch {
  console.error("A service connection failed. Check its environment variables and provider status.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}