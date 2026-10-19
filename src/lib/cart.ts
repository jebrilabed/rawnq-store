export type CartLine = { key: string; slug: string; name: string; image: string; price: number; qty: number; option?: string };

function validImageUrl(image: string) {
  if (image.startsWith("/") && !image.startsWith("//") && !image.includes("\\") && !/[\u0000-\u001f]/.test(image)) return true;
  try {
    const url = new URL(image);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export function parseCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];

  const lines: CartLine[] = [];
  for (const row of value.slice(0, 50)) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const slug = typeof item.slug === "string" ? item.slug.trim().slice(0, 160) : "";
    const name = typeof item.name === "string" ? item.name.trim().slice(0, 120) : "";
    const image = typeof item.image === "string" ? item.image.trim().slice(0, 500) : "";
    const price = Number(item.price);
    const qty = Number(item.qty);
    const option = typeof item.option === "string" ? item.option.trim().slice(0, 100) : "";
    if (!/^[a-z0-9-]{1,160}$/.test(slug) || !name || !validImageUrl(image)) continue;
    if (!Number.isFinite(price) || price <= 0 || price > 99_999_999.99) continue;
    if (!Number.isInteger(qty) || qty < 1) continue;
    const suppliedKey = typeof item.key === "string" ? item.key.trim() : "";
    const key = suppliedKey && suppliedKey.length <= 400 ? suppliedKey : `${slug}|${option}`;
    if (lines.some((line) => line.key === key)) continue;
    lines.push({ key, slug, name, image, price, qty: Math.min(qty, 99), option: option || undefined });
  }
  return lines;
}
