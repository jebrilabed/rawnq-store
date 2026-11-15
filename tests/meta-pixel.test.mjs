import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { loadTypeScript } from "./load-typescript.mjs";

const {
  getMetaPixelId,
  isMetaPixelEnabled,
  isPurchaseTracked,
  markPurchaseTracked,
} = loadTypeScript(new URL("../src/lib/analytics/pixel.ts", import.meta.url));

const {
  hashForMeta,
  hashPhoneForMeta,
  isCapiConfigured,
  sendCapiPurchaseEvent,
} = loadTypeScript(new URL("../src/lib/analytics/capi.ts", import.meta.url));

test("Meta Pixel ID reading and enabled state", () => {
  const original = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  try {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    assert.equal(getMetaPixelId(), null);
    assert.equal(isMetaPixelEnabled(), false);

    process.env.NEXT_PUBLIC_META_PIXEL_ID = "   ";
    assert.equal(getMetaPixelId(), null);
    assert.equal(isMetaPixelEnabled(), false);

    process.env.NEXT_PUBLIC_META_PIXEL_ID = "123456789012345";
    assert.equal(getMetaPixelId(), "123456789012345");
    assert.equal(isMetaPixelEnabled(), true);
  } finally {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = original;
  }
});

test("hashForMeta trims, converts to lowercase, and produces SHA-256", () => {
  assert.equal(hashForMeta(undefined), undefined);
  assert.equal(hashForMeta(""), undefined);
  assert.equal(hashForMeta("   "), undefined);

  const raw = "  User@Example.COM  ";
  const expected = crypto.createHash("sha256").update("user@example.com", "utf8").digest("hex");
  assert.equal(hashForMeta(raw), expected);
});

test("hashPhoneForMeta strips non-digits and produces SHA-256", () => {
  assert.equal(hashPhoneForMeta(undefined), undefined);
  assert.equal(hashPhoneForMeta(""), undefined);

  const phoneWithPunctuation = "+972 (59) 123-4567";
  const expected = crypto.createHash("sha256").update("972591234567", "utf8").digest("hex");
  assert.equal(hashPhoneForMeta(phoneWithPunctuation), expected);
});

test("Purchase deduplication prevents duplicate event tracking for the same order", () => {
  const testOrderNumber = `TEST-${Date.now()}`;

  assert.equal(isPurchaseTracked(testOrderNumber), false);

  markPurchaseTracked(testOrderNumber);

  assert.equal(isPurchaseTracked(testOrderNumber), true);
  // Re-checking does not change state
  assert.equal(isPurchaseTracked(testOrderNumber), true);
});

test("CAPI configuration detection", () => {
  const originalToken = process.env.META_ACCESS_TOKEN;
  const originalPixelId = process.env.META_PIXEL_ID;
  const originalPublicPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  try {
    delete process.env.META_ACCESS_TOKEN;
    delete process.env.META_PIXEL_ID;
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    assert.equal(isCapiConfigured(), false);

    process.env.NEXT_PUBLIC_META_PIXEL_ID = "123456";
    // Still false because META_ACCESS_TOKEN is missing
    assert.equal(isCapiConfigured(), false);

    process.env.META_ACCESS_TOKEN = "test_token";
    // Now true because pixelId is resolved from NEXT_PUBLIC_META_PIXEL_ID
    assert.equal(isCapiConfigured(), true);

    process.env.META_PIXEL_ID = "987654";
    assert.equal(isCapiConfigured(), true);
  } finally {
    process.env.META_ACCESS_TOKEN = originalToken;
    process.env.META_PIXEL_ID = originalPixelId;
    process.env.NEXT_PUBLIC_META_PIXEL_ID = originalPublicPixel;
  }
});

test("sendCapiPurchaseEvent safely skips when unconfigured without throwing", async () => {
  const originalToken = process.env.META_ACCESS_TOKEN;
  delete process.env.META_ACCESS_TOKEN;

  try {
    const mockOrder = {
      orderNumber: "RQ-TEST-123456",
      createdAt: new Date().toISOString(),
      status: "NEW",
      customer: {
        name: "خالد عبد الله",
        phone: "0599112233",
        city: "رام الله",
        address: "شارع الإرسال",
      },
      payment: "cod",
      items: [
        {
          slug: "ceramic-vase",
          name: "مزهرية سيراميك",
          image: "/products/vase.jpg",
          qty: 2,
          unitPrice: 65,
        },
      ],
      subtotal: 130,
      shipping: 20,
      total: 150,
    };

    const result = await sendCapiPurchaseEvent(mockOrder);
    assert.equal(result.ok, false);
    assert.equal(result.skipped, true);
    assert.match(result.reason, /META_ACCESS_TOKEN/);
  } finally {
    process.env.META_ACCESS_TOKEN = originalToken;
  }
});
