import { FAQ, PAGES } from "./content";
import { STORE, SHIPPING_FEE } from "@/lib/config";
import { prisma } from "./prisma";

export type Settings = {
  storeName: string; phone: string; whatsapp: string; instagram: string;
  shippingFee: number; freeShippingFrom: number | null;
  cod: boolean; bank: boolean; bankDetails: string; lowStockThreshold: number;
  bankAccountName: string; bankIban: string; bankAccountNumber: string;
  deliveryAreas: DeliveryArea[];
};
export type DeliveryArea = { id: string; name: string; fee: number };
export type Content = { about: string; delivery: string; faq: [string, string][] };

export async function getSettings(): Promise<Settings> {
  const [row, areas] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { id: 1 } }),
    prisma.deliveryArea.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  const shippingFee = Number(row?.shippingFee ?? SHIPPING_FEE);
  return {
    storeName: row?.storeName ?? STORE.name,
    phone: row?.phone ?? STORE.phone,
    whatsapp: row?.whatsapp ?? row?.phone ?? "",
    instagram: row?.instagram ?? STORE.instagram,
    shippingFee,
    freeShippingFrom: null,
    cod: row?.cod ?? true,
    bank: row?.bank ?? true,
    bankDetails: row?.bankDetails ?? "",
    bankAccountName: row?.bankAccountName ?? "",
    bankIban: row?.bankIban ?? "",
    bankAccountNumber: row?.bankAccountNumber ?? "",
    lowStockThreshold: row?.lowStockThreshold ?? 5,
    deliveryAreas: areas.length
      ? areas.map((area) => ({ id: area.id, name: area.name, fee: Number(area.fee) }))
      : [{ id: "legacy-delivery", name: "التوصيل", fee: shippingFee }],
  };
}

export async function getContent(): Promise<Content> {
  const row = await prisma.storeContent.findUnique({ where: { id: 1 } });
  if (!row) return { about: PAGES.about.body, delivery: PAGES.delivery.body, faq: FAQ.map(([q, a]) => [q, a]) };
  return { about: row.about, delivery: row.delivery, faq: row.faq as [string, string][] };
}

export async function saveSettings(settings: Settings) {
  await prisma.$transaction(async (tx) => {
    await tx.storeSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1, storeName: settings.storeName, phone: settings.phone, whatsapp: settings.whatsapp,
        instagram: settings.instagram, shippingFee: settings.shippingFee, freeShippingFrom: null,
        cod: settings.cod, bank: settings.bank, bankDetails: settings.bankDetails,
        bankAccountName: settings.bankAccountName, bankIban: settings.bankIban,
        bankAccountNumber: settings.bankAccountNumber,
        lowStockThreshold: settings.lowStockThreshold,
      },
      update: {
        storeName: settings.storeName, phone: settings.phone, whatsapp: settings.whatsapp,
        instagram: settings.instagram, shippingFee: settings.shippingFee, freeShippingFrom: null,
        cod: settings.cod, bank: settings.bank, bankDetails: settings.bankDetails,
        bankAccountName: settings.bankAccountName, bankIban: settings.bankIban,
        bankAccountNumber: settings.bankAccountNumber,
        lowStockThreshold: settings.lowStockThreshold,
      },
    });
    await tx.deliveryArea.deleteMany();
    await tx.deliveryArea.createMany({
      data: settings.deliveryAreas.map((area, sortOrder) => ({ name: area.name, fee: area.fee, sortOrder })),
    });
  });
}

