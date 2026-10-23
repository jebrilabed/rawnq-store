import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";

const { hashPassword, verifyPassword } = loadTypeScript(new URL("../src/lib/auth/password.ts", import.meta.url));
const { addTokenToSession, addUserToToken } = loadTypeScript(new URL("../src/lib/auth/session.ts", import.meta.url));
const { shippingFor } = loadTypeScript(new URL("../src/lib/pricing.ts", import.meta.url));
const { parseCart } = loadTypeScript(new URL("../src/lib/cart.ts", import.meta.url));
const { LOCALES, isLocale, localeDirection, localizedValue, translate } = loadTypeScript(new URL("../src/lib/i18n.ts", import.meta.url));
const { orderCategories } = loadTypeScript(new URL("../src/lib/categories.ts", import.meta.url));

test("store localization supports all configured locales and proper text direction", () => {
  assert.deepEqual(LOCALES, ["ar", "en", "he", "ru"]);
  assert.equal(isLocale("he"), true);
  assert.equal(isLocale("fr"), false);
  assert.equal(localeDirection("ar"), "rtl");
  assert.equal(localeDirection("he"), "rtl");
  assert.equal(localeDirection("en"), "ltr");
  assert.equal(localeDirection("ru"), "ltr");
  assert.equal(translate("en", "تسوّق حسب القسم"), "Shop by category");
  assert.equal(translate("en", "ملفي الشخصي"), "My profile");
  assert.equal(translate("he", "لوحة التحكم"), "לוח הבקרה");
  assert.equal(translate("ru", "بيانات الحساب"), "Данные аккаунта");
  assert.equal(localizedValue('{"ru":"Кухонная утварь"}', "ru", "أدوات مطبخ"), "Кухонная утварь");
});

test("password hashes use unique salts and verify only the matching password", async () => {
  const first = await hashPassword("correct horse battery staple");
  const second = await hashPassword("correct horse battery staple");

  assert.match(first, /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("correct horse battery staple", first), true);
  assert.equal(await verifyPassword("wrong password", first), false);
  assert.equal(await verifyPassword("correct horse battery staple", "invalid"), false);
});

test("Auth.js token and session carry the authenticated database identity and role", () => {
  const token = addUserToToken({}, { id: "customer-123", role: "CUSTOMER" });
  assert.equal(token.sub, "customer-123");
  assert.equal(token.role, "CUSTOMER");

  const session = addTokenToSession({ user: { name: "A", email: "a@example.com" }, expires: "2099-01-01" }, token);
  assert.equal(session.user.id, "customer-123");
  assert.equal(session.user.role, "CUSTOMER");

  const adminToken = addUserToToken({}, { id: "admin-123", role: "ADMIN" });
  const adminSession = addTokenToSession({ user: {}, expires: "2099-01-01" }, adminToken);
  assert.equal(adminSession.user.id, "admin-123");
  assert.equal(adminSession.user.role, "ADMIN");
});

test("shipping is free at the configured threshold and charged below it", () => {
  assert.equal(shippingFor(99.99, 20, 100), 20);
  assert.equal(shippingFor(100, 20, 100), 0);
  assert.equal(shippingFor(100, 20, null), 20);
});

test("cart restoration rejects malformed entries and clamps quantities", () => {
  const lines = parseCart([
    { key: "ok", slug: "gold-jug", name: "إبريق", image: "/products/jug.jpg", price: 45, qty: 100 },
    { key: "bad-url", slug: "other", name: "صورة غير موثوقة", image: "https://example.invalid/image.jpg", price: 10, qty: 1 },
    { key: "bad-qty", slug: "bad", name: "كمية غير صالحة", image: "/products/jug.jpg", price: 10, qty: 0 },
  ]);

  assert.equal(lines.length, 1);
  assert.equal(lines[0].qty, 99);
  assert.equal(lines[0].slug, "gold-jug");
});

test("category ordering keeps each parent before all nested descendants", () => {
  const ordered = orderCategories([
    { slug: "child", name: "Child", parentSlug: "parent" },
    { slug: "other", name: "Other" },
    { slug: "grandchild", name: "Grandchild", parentSlug: "child" },
    { slug: "parent", name: "Parent" },
  ]);

  assert.deepEqual(ordered.map(({ category, depth }) => [category.slug, depth]), [
    ["other", 0],
    ["parent", 0],
    ["child", 1],
    ["grandchild", 2],
  ]);
});
