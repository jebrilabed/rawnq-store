import crypto from "node:crypto";
import https from "node:https";
import type { OrderSummary } from "@/lib/orders";

/**
 * Meta Conversions API (CAPI) Integration
 * Documentation: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

const GRAPH_API_VERSION = "v21.0";
const REQUEST_TIMEOUT_MS = 10_000;

export type CapiCustomerData = {
  email?: string;
  phone?: string;
  name?: string;
  city?: string;
  clientIp?: string;
  userAgent?: string;
};

export type CapiPurchaseOptions = {
  customer?: CapiCustomerData;
  sourceUrl?: string;
  eventId?: string;
};

export type CapiResult =
  | { ok: true; eventsReceived: number; fbtraceId?: string }
  | { ok: false; skipped: boolean; reason: string; error?: string };

/**
 * SHA-256 hashing helper conforming to Meta's normalization standards.
 * Trims leading/trailing whitespace and converts to lowercase before hashing.
 */
export function hashForMeta(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized, "utf8").digest("hex");
}

/**
 * Normalizes phone numbers for Meta (digits only).
 */
export function hashPhoneForMeta(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  return crypto.createHash("sha256").update(digits, "utf8").digest("hex");
}

/**
 * Reads server-side CAPI credentials.
 * Never exposes the token to client or console.
 */
function getCapiCredentials(): { pixelId: string; accessToken: string; testEventCode?: string } | null {
  const accessToken = process.env.META_ACCESS_TOKEN?.trim();
  const pixelId = process.env.META_PIXEL_ID?.trim() || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const testEventCode = process.env.META_TEST_EVENT_CODE?.trim();

  if (!accessToken || !pixelId) {
    return null;
  }
  return { accessToken, pixelId, testEventCode };
}

/**
 * Checks whether server-side Meta Conversions API is configured.
 */
export function isCapiConfigured(): boolean {
  return getCapiCredentials() !== null;
}

/**
 * Sends an event payload to the Meta Conversions API graph endpoint.
 */
async function sendCapiEvents(
  pixelId: string,
  accessToken: string,
  events: Record<string, unknown>[],
  testEventCode?: string
): Promise<CapiResult> {
  const payload: Record<string, unknown> = {
    data: events,
  };
  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  const body = JSON.stringify(payload);

  return new Promise((resolve) => {
    const request = https.request(
      {
        hostname: "graph.facebook.com",
        port: 443,
        path: `/${GRAPH_API_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          Accept: "application/json",
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer | string) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        );
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          const statusCode = response.statusCode ?? 0;
          try {
            const parsed = JSON.parse(text) as Record<string, unknown>;
            if (statusCode >= 200 && statusCode < 300 && parsed.events_received !== undefined) {
              return resolve({
                ok: true,
                eventsReceived: Number(parsed.events_received),
                fbtraceId: typeof parsed.fbtrace_id === "string" ? parsed.fbtrace_id : undefined,
              });
            }
            const errObj = (parsed.error as Record<string, unknown>) ?? {};
            const message = typeof errObj.message === "string" ? errObj.message : `HTTP ${statusCode}`;
            return resolve({
              ok: false,
              skipped: false,
              reason: "Meta CAPI returned an error",
              error: message,
            });
          } catch {
            return resolve({
              ok: false,
              skipped: false,
              reason: `Meta CAPI non-JSON response (HTTP ${statusCode})`,
            });
          }
        });
      }
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error("Meta CAPI connection timed out"));
      resolve({
        ok: false,
        skipped: false,
        reason: "Connection timeout to Meta CAPI",
      });
    });

    request.on("error", (err) => {
      resolve({
        ok: false,
        skipped: false,
        reason: "Network error connecting to Meta CAPI",
        error: err.message,
      });
    });

    request.write(body);
    request.end();
  });
}

/**
 * Builds and sends a server-side Purchase event to Meta Conversions API.
 * Uses exact same event_id (`order_${order.orderNumber}`) as client-side pixel to ensure deduplication.
 */
export async function sendCapiPurchaseEvent(
  order: OrderSummary,
  options: CapiPurchaseOptions = {}
): Promise<CapiResult> {
  const creds = getCapiCredentials();
  if (!creds) {
    return {
      ok: false,
      skipped: true,
      reason: "META_ACCESS_TOKEN or META_PIXEL_ID is not configured in server environment.",
    };
  }

  const eventId = options.eventId ?? `order_${order.orderNumber}`;
  const eventTime = Math.floor(new Date(order.createdAt).getTime() / 1000) || Math.floor(Date.now() / 1000);

  // Parse customer details
  const nameParts = (order.customer.name || options.customer?.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  // Hash eligible customer identifiers
  const userData: Record<string, unknown> = {
    ph: hashPhoneForMeta(order.customer.phone || options.customer?.phone),
    fn: hashForMeta(firstName),
    ln: hashForMeta(lastName),
    ct: hashForMeta(order.customer.city || options.customer?.city),
  };

  if (options.customer?.email) {
    userData.em = hashForMeta(options.customer.email);
  }
  if (options.customer?.clientIp) {
    userData.client_ip_address = options.customer.clientIp;
  }
  if (options.customer?.userAgent) {
    userData.client_user_agent = options.customer.userAgent;
  }

  // Remove undefined values
  for (const key of Object.keys(userData)) {
    if (userData[key] === undefined) delete userData[key];
  }

  // Contents array
  const contents = order.items.map((item) => ({
    id: item.slug,
    quantity: item.qty,
    item_price: item.unitPrice,
  }));

  const contentIds = order.items.map((item) => item.slug);
  const numItems = order.items.reduce((sum, item) => sum + item.qty, 0);

  const eventPayload = {
    event_name: "Purchase",
    event_time: eventTime,
    event_id: eventId,
    event_source_url: options.sourceUrl,
    action_source: "website",
    user_data: userData,
    custom_data: {
      currency: "ILS",
      value: order.total,
      content_type: "product",
      contents,
      content_ids: contentIds,
      num_items: numItems,
      order_id: order.orderNumber,
    },
  };

  try {
    return await sendCapiEvents(creds.pixelId, creds.accessToken, [eventPayload], creds.testEventCode);
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      reason: "Unexpected exception during CAPI call",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
