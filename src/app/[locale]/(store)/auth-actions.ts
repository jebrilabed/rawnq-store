"use server";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/data/prisma";
import { getSettings } from "@/lib/data/db";
import bestRouteAreaCatalog from "@/lib/integrations/best-route-areas.json";
import { isLocale } from "@/lib/i18n";

const text = (form: FormData, name: string, max = 200) => String(form.get(name) ?? "").trim().slice(0, max);

export async function customerLoginAction(form: FormData) {
  const email = text(form, "email", 254).toLowerCase();
  const password = String(form.get("password") ?? "");
  const requestedLocale = text(form, "locale", 12);
  const locale = isLocale(requestedLocale) ? requestedLocale : "ar";
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
    : next === "orders" ? `/${locale}/orders` : next === "profile" ? `/${locale}/profile` : `/${locale}`;
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
  const deliveryAreaName = text(form, "deliveryAreaName", 100);
  const password = String(form.get("password") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");
  const requestedLocale = text(form, "locale", 12);
  const locale = isLocale(requestedLocale) ? requestedLocale : "ar";
  const settings = await getSettings("ar");
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[0-9+\s-]{8,20}$/.test(phone)
    || !bestRouteAreaCatalog.areas.some((area) => area.name === city)
    || !settings.deliveryAreas.some((area) => area.value === deliveryAreaName)
    || address.length < 4 || password.length < 8 || password.length > 128 || password !== confirmPassword) {
    redirect(`/${locale}/register?error=invalid`);
  }
  try {
    await prisma.customerUser.create({ data: { name, email, phone, city, address, deliveryAreaName, passwordHash: await hashPassword(password), role: "CUSTOMER" } });
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

export async function updateCustomerProfileAction(form: FormData) {
  const session = await auth();
  if (session?.user?.role !== "CUSTOMER" || !session.user.id) redirect("/ar/login?next=profile");

  const requestedLocale = text(form, "locale", 12);
  const locale = isLocale(requestedLocale) ? requestedLocale : "ar";
  const name = text(form, "name", 80);
  const phone = text(form, "phone", 20);
  const city = text(form, "city", 60);
  const address = text(form, "address", 200);
  const deliveryAreaName = text(form, "deliveryAreaName", 100);
  const settings = await getSettings("ar");

  if (name.length < 2 || !/^[0-9+\s-]{8,20}$/.test(phone)
    || !bestRouteAreaCatalog.areas.some((area) => area.name === city)
    || !settings.deliveryAreas.some((area) => area.value === deliveryAreaName)
    || address.length < 4) {
    redirect(`/${locale}/profile?error=invalid`);
  }

  await prisma.customerUser.update({
    where: { id: session.user.id },
    data: { name, phone, city, address, deliveryAreaName },
  });
  revalidatePath(`/${locale}/profile`);
  revalidatePath(`/${locale}/checkout`);
  redirect(`/${locale}/profile?saved=1`);
}

export async function customerLogoutAction(form: FormData) {
  const session = await auth();
  if (session?.user?.role !== "CUSTOMER" || !session.user.id) redirect("/ar/login");

  const requestedLocale = text(form, "locale", 12);
  const locale = isLocale(requestedLocale) ? requestedLocale : "ar";
  await signOut({ redirectTo: `/${locale}/login` });
}
