"use server";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/data/prisma";

const text = (form: FormData, name: string, max = 200) => String(form.get(name) ?? "").trim().slice(0, max);

export async function customerLoginAction(form: FormData) {
  const email = text(form, "email", 254).toLowerCase();
  const password = String(form.get("password") ?? "");
  const locale = text(form, "locale", 12) || "ar";
  const next = text(form, "next", 12);
  const adminRequested = next === "admin";
  if (!password || password.length > 128) redirect(`/${locale}/login?error=credentials${adminRequested ? "&next=admin" : ""}`);
  const customer = adminRequested ? null : await prisma.customerUser.findUnique({ where: { email }, select: { id: true } });
  const admin = adminRequested || !customer
    ? await prisma.adminUser.findUnique({ where: { email }, select: { id: true } })
    : null;
  const accountType = adminRequested || (!customer && admin) ? "admin" : "customer";
  const redirectTo = admin
    ? "/admin"
    : next === "orders" ? `/${locale}/orders` : `/${locale}`;
  try {
    await signIn("credentials", { email, password, accountType, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) redirect(`/${locale}/login?error=credentials${adminRequested ? "&next=admin" : ""}`);
    throw error;
  }
}

export async function customerRegisterAction(form: FormData) {
  const name = text(form, "name", 80);
  const email = text(form, "email", 254).toLowerCase();
  const phone = text(form, "phone", 20);
  const city = text(form, "city", 60);
  const address = text(form, "address", 200);
  const password = String(form.get("password") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");
  const locale = text(form, "locale", 12) || "ar";
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[0-9+\s-]{8,20}$/.test(phone) || city.length < 2 || address.length < 4 || password.length < 8 || password.length > 128 || password !== confirmPassword) {
    redirect(`/${locale}/register?error=invalid`);
  }
  try {
    await prisma.customerUser.create({ data: { name, email, phone, city, address, passwordHash: await hashPassword(password), role: "CUSTOMER" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") redirect(`/${locale}/register?error=exists`);
    throw error;
  }
  try {
    await signIn("credentials", { email, password, redirectTo: `/${locale}` });
  } catch (error) {
    if (error instanceof AuthError) redirect(`/${locale}/login?error=credentials`);
    throw error;
  }
}
