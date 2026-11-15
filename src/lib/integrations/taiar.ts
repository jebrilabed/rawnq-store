import https from "node:https";

// ---------------------------------------------------------------------------
// Taiar API client
// Base URL: https://api.taiar.org/api
// ---------------------------------------------------------------------------

const TAIAR_HOST = "api.taiar.org";
const TAIAR_BASE_PATH = "/api";
const TOKEN_TTL_MS = 23 * 60 * 60 * 1000; // 23 hours (tokens last ~24h)
const CITY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const REQUEST_TIMEOUT_MS = 12_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaiarCreateOrderInput = {
  referenceId: string;
  receiverName: string;
  receiverMobile: string;
  receiverCity: number; // Taiar city ID (city_id from /addresses/cities)
  receiverAddress: string;
  receiverCountry?: string; // defaults to "PS"
  title: string;
  codValues: number; // subtotal if COD, 0 if prepaid
  paymentType: "cash" | "check" | "cash/check"; // Taiar string enum
  deliveryFee?: number; // defaults to 0
  commission?: number; // defaults to 0
  discount?: number; // defaults to 0
  quantity: number;
  description: string;
  note?: string;
};export type TaiarCity = {
  id: number;
  name: string;
  [key: string]: unknown;
};

export type TaiarShipmentDetails = {
  id: number;
  reference_id: string;
  status: number;
  money_status?: string | number;
  delivery_fee?: string | number;
  [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class TaiarRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaiarRejectedError";
  }
}

// ---------------------------------------------------------------------------
// Credentials helper (server-side only)
// ---------------------------------------------------------------------------

function requireCredentials(): { phone: string; password: string; senderId: number } {
  const phone = process.env.TAIAR_PHONE?.trim();
  const password = process.env.TAIAR_PASSWORD;
  const senderIdRaw = process.env.TAIAR_SENDER_ID?.trim();
  if (!phone || !password) {
    throw new Error("أضف TAIAR_PHONE وTAIAR_PASSWORD إلى .env.local أولاً.");
  }
  const senderId = Number(senderIdRaw);
  if (!senderIdRaw || !Number.isFinite(senderId)) {
    throw new Error("أضف TAIAR_SENDER_ID (رقم) إلى .env.local أولاً.");
  }
  return { phone, password, senderId };
}

// ---------------------------------------------------------------------------
// Error message sanitisation — strips credentials/token from messages
// ---------------------------------------------------------------------------

function sanitizeError(message: string): string {
  let safe = message;
  for (const secret of [
    process.env.TAIAR_PHONE,
    process.env.TAIAR_PASSWORD,
    // also scrub any cached token value
    tokenCache.token ?? undefined,
  ]) {
    if (secret) safe = safe.replaceAll(secret, "[مخفي]");
  }
  return safe.slice(0, 300);
}

// ---------------------------------------------------------------------------
// Low-level HTTP helper (native https module, mirrors best-route.ts style)
// ---------------------------------------------------------------------------

type HttpMethod = "GET" | "POST";

function requestJson(
  path: string,
  method: HttpMethod,
  payload?: unknown,
  extraHeaders?: Record<string, string | number>,
): Promise<unknown> {
  const body = payload === undefined ? undefined : JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const headers: Record<string, string | number> = {
      Accept: "application/json",
      ...extraHeaders,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(body);
    }

    const request = https.request(
      {
        hostname: TAIAR_HOST,
        port: 443,
        path: `${TAIAR_BASE_PATH}${path}`,
        method,
        headers,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer | string) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
        );
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          const status = response.statusCode ?? 0;
          if (status < 200 || status >= 300) {
            // Try to parse error body for Taiar's { success: false, message } shape
            try {
              const parsed = JSON.parse(text) as Record<string, unknown>;
              if (parsed && typeof parsed.message === "string") {
                return reject(new TaiarRejectedError(parsed.message));
              }
            } catch {
              // fall through
            }
            return reject(new Error(`HTTP ${status || "unknown"} من Taiar.`));
          }
          try {
            resolve(JSON.parse(text));
          } catch {
            reject(new Error("وصل رد غير صالح من Taiar."));
          }
        });
      },
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () =>
      request.destroy(new Error("انتهت مهلة الاتصال بـ Taiar.")),
    );
    request.on("error", reject);
    if (body !== undefined) request.write(body);
    request.end();
  });
}

// ---------------------------------------------------------------------------
// Token cache (in-memory, never sent to client)
// ---------------------------------------------------------------------------

const tokenCache: { token: string | null; expiresAt: number } = {
  token: null,
  expiresAt: 0,
};

/** Authenticates with Taiar and returns a JWT token (cached for ~23 hours). */
export async function authenticate(): Promise<string> {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  const { phone, password } = requireCredentials();
  const response = await requestJson("/login", "POST", { phone, password });
  const data = response as Record<string, unknown>;

  // Taiar returns: { status: "success", message: "Login successful", token: "...", userId: ... }
  // Token lives at the root level (not nested in data.data)
  const isSuccess =
    data?.status === "success" ||
    data?.status === true ||
    data?.status === 200 ||
    data?.success === true ||
    data?.code === 200;

  // Extract token — Taiar puts it at root level
  const token =
    (typeof data?.token === "string" ? data.token : undefined) ??
    (typeof (data?.data as Record<string, unknown>)?.token === "string"
      ? (data.data as Record<string, unknown>).token as string
      : undefined) ??
    (typeof data?.access_token === "string" ? data.access_token : undefined);

  if (!token || !isSuccess) {
    const msg = typeof data?.message === "string" ? data.message : "فشل تسجيل الدخول إلى Taiar.";
    throw new TaiarRejectedError(msg);
  }

  tokenCache.token = token;
  tokenCache.expiresAt = Date.now() + TOKEN_TTL_MS;
  return token;
}

// ---------------------------------------------------------------------------
// City list cache (in-memory, 1 hour TTL)
// ---------------------------------------------------------------------------

const cityCache: {
  ar: { list: TaiarCity[]; expiresAt: number } | null;
  en: { list: TaiarCity[]; expiresAt: number } | null;
} = { ar: null, en: null };

/** Returns the Taiar city list. Cached for 1 hour per language. */
export async function getTaiarCities(lang: "ar" | "en" = "ar"): Promise<TaiarCity[]> {
  const cached = cityCache[lang];
  if (cached && Date.now() < cached.expiresAt) return cached.list;

  const token = await authenticate();
  const response = await requestJson(`/addresses/cities?lang=${lang}`, "GET", undefined, {
    Authorization: `Bearer ${token}`,
  });
  const data = response as Record<string, unknown>;

  // Taiar cities response: { data: [...cities...], metadata: {...} }
  // No success/status field — presence of data array indicates success
  let list: TaiarCity[];
  if (Array.isArray(data?.data)) {
    // Normalize city_id -> id if needed
    list = (data.data as Record<string, unknown>[]).map((c) => ({
      id: (c.city_id ?? c.id) as number,
      name: (c.name ?? "") as string,
      ...c,
    }));
  } else if (Array.isArray(data)) {
    list = (data as Record<string, unknown>[]).map((c) => ({
      id: (c.city_id ?? c.id) as number,
      name: (c.name ?? "") as string,
      ...c,
    }));
  } else {
    throw new Error("فشل جلب قائمة مدن Taiar.");
  }

  cityCache[lang] = { list, expiresAt: Date.now() + CITY_CACHE_TTL_MS };
  return list;
}

// ---------------------------------------------------------------------------
// Create shipment
// ---------------------------------------------------------------------------

/** Creates a Taiar shipment and returns the provider order ID and reference ID. */
export async function createTaiarOrder(
  input: TaiarCreateOrderInput,
): Promise<{ orderId: string; referenceId: string }> {
  const { senderId } = requireCredentials();
  const token = await authenticate();

  const body = {
    reference_id: input.referenceId,
    sender_id: senderId,
    receiver_name: input.receiverName,
    receiver_mobile: input.receiverMobile,
    receiver_city: input.receiverCity,
    receiver_address: input.receiverAddress,
    receiver_country: input.receiverCountry ?? "PS",
    title: input.title,
    // cod_values must be an array of { value: number } objects per Taiar API
    cod_values: [{ value: input.codValues }],
    payment_type: input.paymentType, // "cash" | "check" | "cash/check"
    order_type: "delivery",          // only valid string Taiar accepts
    delivery_fee: input.deliveryFee ?? 0,
    commission: input.commission ?? 0,
    discount: input.discount ?? 0,
    quantity: input.quantity,
    description: input.description,
    note: input.note ?? "",
  };

  const response = await requestJson("/orders", "POST", body, {
    Authorization: `Bearer ${token}`,
  });
  const data = response as Record<string, unknown>;

  // Taiar may return: { status: "success", message: "...", data: { id, reference_id, ... } }
  // OR: { id, reference_id, ... } directly at root
  // We detect rejection by checking if data.data?.id or data.id is present
  const isSuccess =
    data?.status === "success" ||
    data?.status === true ||
    data?.status === 200 ||
    data?.success === true ||
    data?.code === 200;

  if (!isSuccess) {
    const msg =
      typeof data?.message === "string" ? data.message : "رفض Taiar الطلب.";
    throw new TaiarRejectedError(msg);
  }

  const orderData =
    (data?.data as Record<string, unknown> | undefined) ?? data;
  const orderId =
    orderData?.id !== undefined ? String(orderData.id) :
    orderData?.order_id !== undefined ? String(orderData.order_id) :
    undefined;

  const referenceId =
    typeof orderData?.reference_id === "string"
      ? orderData.reference_id
      : input.referenceId;

  if (!orderId) throw new Error("لم يرجع Taiar بمعرّف الشحنة.");
  return { orderId, referenceId };
}

// ---------------------------------------------------------------------------
// Get shipment details
// ---------------------------------------------------------------------------

/** Fetches a single Taiar shipment by its provider order ID. */
export async function getTaiarShipment(orderId: string): Promise<TaiarShipmentDetails> {
  const token = await authenticate();
  const response = await requestJson(`/orders/${encodeURIComponent(orderId)}`, "GET", undefined, {
    Authorization: `Bearer ${token}`,
  });
  const data = response as Record<string, unknown>;

  // Taiar may return: { status: "success", data: { ... } } or the object directly
  const isSuccess =
    data?.status === "success" ||
    data?.status === true ||
    data?.status === 200 ||
    data?.success === true ||
    data?.code === 200 ||
    // If the response itself has an id field, treat it as success
    data?.id !== undefined ||
    (data?.data as Record<string, unknown>)?.id !== undefined;

  if (!isSuccess) {
    const msg = typeof data?.message === "string" ? data.message : "فشل جلب بيانات الشحنة من Taiar.";
    throw new TaiarRejectedError(msg);
  }

  // Unwrap data.data if nested, otherwise use data directly
  const shipment =
    data?.data && typeof data.data === "object" && !Array.isArray(data.data) && (data.data as Record<string, unknown>).id !== undefined
      ? (data.data as TaiarShipmentDetails)
      : (data as TaiarShipmentDetails);

  return shipment;
}

// Re-export sanitizeError for use in taiar-orders.ts
export { sanitizeError as sanitizeTaiarError };
