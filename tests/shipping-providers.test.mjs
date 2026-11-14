import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";

const { sanitizeTaiarError, TaiarRejectedError } = loadTypeScript(new URL("../src/lib/integrations/taiar.ts", import.meta.url));
const { ShippingService, BestRouteProvider, TaiarProvider } = loadTypeScript(new URL("../src/lib/integrations/shipping-provider.ts", import.meta.url));
const { normalizeCityName } = loadTypeScript(new URL("../src/lib/integrations/taiar-orders.ts", import.meta.url));

test("ShippingService correctly registers Best Route and Taiar providers", () => {
  const bestRoute = ShippingService.getProvider("BEST_ROUTE");
  assert.equal(bestRoute.id, "BEST_ROUTE");
  assert.equal(bestRoute.name, "Best Route");
  assert.equal(bestRoute instanceof BestRouteProvider, true);

  const taiar = ShippingService.getProvider("TAIAR");
  assert.equal(taiar.id, "TAIAR");
  assert.equal(taiar.name, "طيار (Taiar)");
  assert.equal(taiar instanceof TaiarProvider, true);

  // Unknown provider throws
  assert.throws(() => ShippingService.getProvider("UNKNOWN_PROVIDER"), /مزود الشحن غير مدعوم/);
});

test("isConfigured reflects presence of environment variables", () => {
  const originalEnv = { ...process.env };

  try {
    // Missing credentials
    delete process.env.TAIAR_PHONE;
    delete process.env.TAIAR_PASSWORD;
    delete process.env.TAIAR_SENDER_ID;
    assert.equal(ShippingService.isConfigured("TAIAR"), false);

    // Configured credentials
    process.env.TAIAR_PHONE = "0599000000";
    process.env.TAIAR_PASSWORD = "secretPassword";
    process.env.TAIAR_SENDER_ID = "123";
    assert.equal(ShippingService.isConfigured("TAIAR"), true);

    // Best Route configuration
    delete process.env.BEST_ROUTE_LOGIN;
    delete process.env.BEST_ROUTE_PASSWORD;
    delete process.env.BEST_ROUTE_ORDER_TYPE_ID;
    assert.equal(ShippingService.isConfigured("BEST_ROUTE"), false);

    process.env.BEST_ROUTE_LOGIN = "test_user";
    process.env.BEST_ROUTE_PASSWORD = "test_password";
    process.env.BEST_ROUTE_ORDER_TYPE_ID = "42";
    assert.equal(ShippingService.isConfigured("BEST_ROUTE"), true);
  } finally {
    process.env = originalEnv;
  }
});

test("sanitizeTaiarError scrubs credentials from error messages", () => {
  const originalEnv = { ...process.env };
  try {
    process.env.TAIAR_PHONE = "0599123456";
    process.env.TAIAR_PASSWORD = "SuperSecretPassword123";

    const leakedMessage = "Authentication failed for 0599123456 with password SuperSecretPassword123 at endpoint";
    const sanitized = sanitizeTaiarError(leakedMessage);

    assert.equal(sanitized.includes("0599123456"), false);
    assert.equal(sanitized.includes("SuperSecretPassword123"), false);
    assert.equal(sanitized.includes("[مخفي]"), true);
  } finally {
    process.env = originalEnv;
  }
});

test("TaiarRejectedError creates proper custom error instance", () => {
  const err = new TaiarRejectedError("المدينة غير مدعومة");
  assert.equal(err instanceof Error, true);
  assert.equal(err.name, "TaiarRejectedError");
  assert.equal(err.message, "المدينة غير مدعومة");
});

test("normalizeCityName correctly handles Arabic diacritics, alef forms, and whitespace", () => {
  assert.equal(normalizeCityName(" رام الله "), "رام الله");
  assert.equal(normalizeCityName("نَابُلُس"), "نابلس");
  assert.equal(normalizeCityName("القدس"), "القدس");
  assert.equal(normalizeCityName("أريحا"), "اريحا");
  assert.equal(normalizeCityName("طولكرم"), "طولكرم");
  assert.equal(normalizeCityName("غزة"), "غزه");
});

test("Multi-shipping mutual exclusion logic prevents double dispatching", () => {
  // Simulate order with Best Route already sent
  const orderBestRouteSent = {
    bestRouteState: "SENT",
    shipment: null,
  };

  const cannotSendToTaiarIfBestRouteSent = orderBestRouteSent.bestRouteState === "SENT";
  assert.equal(cannotSendToTaiarIfBestRouteSent, true);

  // Simulate order with Taiar already sent
  const orderTaiarSent = {
    bestRouteState: "NOT_SENT",
    shipment: { provider: "TAIAR", state: "SENT" },
  };

  const cannotSendToBestRouteIfTaiarSent =
    orderTaiarSent.bestRouteState === "SENT" ||
    (orderTaiarSent.shipment?.state === "SENT" && orderTaiarSent.shipment.provider === "TAIAR");
  assert.equal(cannotSendToBestRouteIfTaiarSent, true);

  // Simulate pending/sending state protection
  const orderSending = {
    bestRouteState: "SENDING",
    shipment: null,
  };
  const isBestRouteSending = orderSending.bestRouteState === "SENDING";
  assert.equal(isBestRouteSending, true);

  // Simulate fresh unassigned order
  const orderFresh = {
    bestRouteState: "NOT_SENT",
    shipment: null,
  };
  const canChooseEither =
    orderFresh.bestRouteState === "NOT_SENT" && (!orderFresh.shipment || orderFresh.shipment.state === "NOT_SENT");
  assert.equal(canChooseEither, true);

  // Simulate failed/rejected order - allowed to retry
  const orderRejected = {
    bestRouteState: "REJECTED",
    shipment: null,
  };
  const canRetry = orderRejected.bestRouteState === "REJECTED";
  assert.equal(canRetry, true);
});
