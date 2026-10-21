import { FAQ, PAGES } from "./content";
import { STORE, SHIPPING_FEE } from "@/lib/config";
import { prisma } from "./prisma";
import { localizedValue, translate } from "@/lib/i18n";

export type Settings = {
  storeName: string; phone: string; whatsapp: string; instagram: string;
  shippingFee: number; freeShippingFrom: number | null;
  cod: boolean; bank: boolean; bankDetails: string; lowStockThreshold: number;
  bankAccountName: string; bankIban: string; bankAccountNumber: string;
  deliveryAreas: DeliveryArea[];
};
export type DeliveryArea = { id: string; value: string; name: string; fee: number; translations: string };
export type Content = { about: string; delivery: string; faq: [string, string][] };
export type StoredContent = Content & { translations: Record<string, { about: string; delivery: string; faq: [string, string][] }> };

export async function getSettings(locale = "ar"): Promise<Settings> {
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
      ? areas.map((area) => ({ id: area.id, value: area.name, name: localizedValue(area.translations, locale, area.name), fee: Number(area.fee), translations: area.translations }))
      : [
        { id: "west-bank", value: "الضفة", name: translate(locale, "الضفة"), fee: 20, translations: "{}" },
        { id: "jerusalem", value: "القدس", name: translate(locale, "القدس"), fee: 30, translations: "{}" },
        { id: "inside", value: "الداخل", name: translate(locale, "الداخل"), fee: 70, translations: "{}" },
      ],
  };
}

export async function getContent(locale = "ar"): Promise<Content> {
  const row = await prisma.storeContent.findUnique({ where: { id: 1 } });
  const base = row
    ? { about: row.about, delivery: row.delivery, faq: row.faq as [string, string][] }
    : { about: PAGES.about.body, delivery: PAGES.delivery.body, faq: FAQ.map(([q, a]) => [q, a] as [string, string]) };
  if (locale === "ar") return base;
  let translated: { about?: string; delivery?: string; faq?: [string, string][] } = {};
  try {
    const parsed: unknown = row ? JSON.parse(row.translations) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const value = (parsed as Record<string, unknown>)[locale];
      if (value && typeof value === "object" && !Array.isArray(value)) translated = value as typeof translated;
    }
  } catch (cause) {
    console.error("Invalid store content translations.", cause);
  }
  const aboutFallback: Record<string, string> = {
    en: "Rawnq Home & Living offers homeware, storage and decor. We carefully select products that bring beauty and quality to your home.",
    he: "רונק Home & Living מציעה כלי בית, פתרונות אחסון ועיצוב. אנו בוחרים בקפידה מוצרים שמכניסים יופי ואיכות לבית.",
    ru: "Rawnq Home & Living — магазин товаров для дома, хранения и декора. Мы тщательно выбираем товары, добавляющие дому красоту и качество.",
  };
  const deliveryFallback: Record<string, string> = {
    en: "We deliver to all governorates. Delivery time is confirmed by phone after the order. Exchange and return terms are set by the store administration.",
    he: "אנו מספקים לכל המחוזות. מועד המשלוח יאושר טלפונית לאחר ההזמנה. תנאי החלפה והחזרה נקבעים על ידי הנהלת החנות.",
    ru: "Мы доставляем во все регионы. Срок доставки подтверждается по телефону после оформления заказа. Условия обмена и возврата определяются администрацией магазина.",
  };
  return {
    about: translated.about || aboutFallback[locale] || base.about,
    delivery: translated.delivery || deliveryFallback[locale] || base.delivery,
    faq: translated.faq?.length ? translated.faq : base.faq.map(([question, answer]) => [translate(locale, question), translate(locale, answer)]),
  };
}

export async function getStoredContent(): Promise<StoredContent> {
  const row = await prisma.storeContent.findUnique({ where: { id: 1 } });
  let translations: StoredContent["translations"] = {};
  try {
    const parsed: unknown = row ? JSON.parse(row.translations) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      translations = parsed as StoredContent["translations"];
    }
  } catch (cause) {
    console.error("Invalid store content translations.", cause);
  }
  return {
    about: row?.about ?? PAGES.about.body,
    delivery: row?.delivery ?? PAGES.delivery.body,
    faq: row ? row.faq as [string, string][] : FAQ.map(([q, a]) => [q, a]),
    translations,
  };
}

export async function saveStoreContent(content: StoredContent) {
  await prisma.storeContent.upsert({
    where: { id: 1 },
    create: { id: 1, about: content.about, delivery: content.delivery, faq: content.faq, translations: JSON.stringify(content.translations) },
    update: { about: content.about, delivery: content.delivery, faq: content.faq, translations: JSON.stringify(content.translations) },
  });
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
      data: settings.deliveryAreas.map((area, sortOrder) => ({ name: area.name, translations: area.translations, fee: area.fee, sortOrder })),
    });
  });
}
