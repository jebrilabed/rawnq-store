import https from "node:https";

const BEST_ROUTE_HOST = "best-route.olivery.io";
const ORDER_TYPES_URL = "https://best-route.io/api/order_types";

type JsonRecord = Record<string, unknown>;
type RpcPayload = {
  jsonrpc: "2.0";
  params: Record<string, unknown> & { login: string; password: string; db: string };
};

export type BestRouteCreateOrderInput = {
  customer_address: string;
  customer_mobile: string;
  customer_area: string;
  customer_name: string;
  reference_id: string;
  cost: number;
  note: string;
  paid: boolean;
  delivery_fee_on_customer: boolean;
  delivery_fee_on_sender: boolean;
  product_note: string;
};

export class BestRouteRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BestRouteRejectedError";
  }
}

export type BestRouteConnectionCheck = {
  checkedAt: string;
  areas: { ok: boolean; count?: number; error?: string };
  subAreas: { ok: boolean; count?: number; error?: string };
  statuses: { ok: boolean; count?: number; error?: string };
  orderTypes: { ok: boolean; count?: number; error?: string; choices?: { id: string; name: string }[] };
};

function credentials(): RpcPayload["params"] {
  const login = process.env.BEST_ROUTE_LOGIN?.trim();
  const password = process.env.BEST_ROUTE_PASSWORD;
  const db = process.env.BEST_ROUTE_DB?.trim() || "best-route";
  if (!login || !password) throw new Error("أضف BEST_ROUTE_LOGIN وBEST_ROUTE_PASSWORD إلى .env.local أولاً.");
  return { login, password, db };
}

function requestJson(url: URL, method: "GET" | "POST", payload?: unknown): Promise<unknown> {
  const body = payload === undefined ? undefined : JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: `${url.pathname}${url.search}`,
      method,
      headers: body === undefined ? { Accept: "application/json" } : {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        const status = response.statusCode ?? 0;
        if (status < 200 || status >= 300) return reject(new Error(`HTTP ${status || "unknown"}`));
        try { resolve(JSON.parse(text)); }
        catch { reject(new Error("وصل رد غير صالح من Best Route.")); }
      });
    });
    request.setTimeout(12_000, () => request.destroy(new Error("انتهت مهلة الاتصال بـ Best Route.")));
    request.on("error", reject);
    if (body !== undefined) request.write(body);
    request.end();
  });
}

function rpcData(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") throw new Error("رد Best Route غير صالح.");
  const envelope = payload as JsonRecord;
  if (envelope.error && typeof envelope.error === "object") {
    const error = envelope.error as JsonRecord;
    throw new BestRouteRejectedError(typeof error.message === "string" ? error.message : "رفض Best Route الطلب.");
  }
  const result = envelope.result;
  if (result && typeof result === "object" && !Array.isArray(result)) {
    const record = result as JsonRecord;
    if (record.status !== undefined && Number(record.status) !== 200) {
      throw new BestRouteRejectedError(typeof record.message === "string" ? record.message : `Best Route أعاد الحالة ${String(record.status)}.`);
    }
    if (record.response !== undefined) return record.response;
  }
  if (result === undefined) throw new Error("لم يرجع Best Route بيانات.");
  return result;
}

async function rpcList(path: string): Promise<unknown[]> {
  const payload: RpcPayload = { jsonrpc: "2.0", params: credentials() };
  const response = rpcData(await requestJson(new URL(`https://${BEST_ROUTE_HOST}${path}`), "GET", payload));
  if (!Array.isArray(response)) throw new Error("صيغة القائمة التي رجعت من Best Route غير متوقعة.");
  return response;
}

async function orderTypesList(): Promise<unknown[]> {
  const payload = await requestJson(new URL(ORDER_TYPES_URL), "GET");
  const candidates: unknown[] = [payload];
  const visited = new Set<unknown>();
  while (candidates.length) {
    const current = candidates.shift();
    if (Array.isArray(current)) return current;
    if (!current || typeof current !== "object" || visited.has(current)) continue;
    visited.add(current);
    const record = current as JsonRecord;
    for (const key of ["response", "result", "data", "order_types", "items"]) {
      if (record[key] !== undefined) candidates.push(record[key]);
    }
  }
  throw new Error("لم أجد قائمة أنواع الطلبات في رد Best Route.");
}

async function checkOrderTypes(): Promise<BestRouteConnectionCheck["orderTypes"]> {
  try {
    const rows = await orderTypesList();
    const choices = rows.flatMap((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return [];
      const row = value as JsonRecord;
      const id = row.id ?? row.order_type_id;
      const name = row.name ?? row.title ?? row.display_name;
      if ((typeof id !== "string" && typeof id !== "number") || (typeof name !== "string" && typeof name !== "number")) return [];
      return [{ id: String(id), name: String(name) }];
    });
    return { ok: true, count: rows.length, choices: choices.slice(0, 50) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر الاتصال بـ Best Route.";
    let safeMessage = message;
    for (const secret of [process.env.BEST_ROUTE_LOGIN, process.env.BEST_ROUTE_PASSWORD]) {
      if (secret) safeMessage = safeMessage.replaceAll(secret, "[مخفي]");
    }
    return { ok: false, error: safeMessage.slice(0, 220) };
  }
}

function requireOrderTypeId() {
  const id = process.env.BEST_ROUTE_ORDER_TYPE_ID?.trim();
  if (!id) throw new Error("أضف BEST_ROUTE_ORDER_TYPE_ID بعد اختيار النوع من قائمة Best Route.");
  return id;
}

function findRemoteOrderId(value: unknown, depth = 0): string | undefined {
  if (depth > 4 || !value || typeof value !== "object") return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const id = findRemoteOrderId(item, depth + 1);
      if (id) return id;
    }
    return undefined;
  }
  const record = value as JsonRecord;
  for (const key of ["order_id", "delivery_id", "id"]) {
    const candidate = record[key];
    if ((typeof candidate === "string" && candidate.trim()) || (typeof candidate === "number" && Number.isFinite(candidate))) return String(candidate);
  }
  for (const key of ["response", "result", "data", "order"]) {
    const id = findRemoteOrderId(record[key], depth + 1);
    if (id) return id;
  }
  return undefined;
}

export async function createBestRouteOrder(input: BestRouteCreateOrderInput): Promise<{ orderId?: string }> {
  const payload = {
    jsonrpc: "2.0",
    params: {
      ...credentials(),
      ...input,
      order_type_id: requireOrderTypeId(),
    },
  };
  const raw = await requestJson(new URL(`https://${BEST_ROUTE_HOST}/create_order`), "POST", payload);
  const result = rpcData(raw);
  return { orderId: findRemoteOrderId(result) };
}

async function checkList(load: () => Promise<unknown[]>): Promise<{ ok: boolean; count?: number; error?: string }> {
  try { return { ok: true, count: (await load()).length }; }
  catch (error) {
    const message = error instanceof Error ? error.message : "تعذر الاتصال بـ Best Route.";
    let safeMessage = message;
    for (const secret of [process.env.BEST_ROUTE_LOGIN, process.env.BEST_ROUTE_PASSWORD]) {
      if (secret) safeMessage = safeMessage.replaceAll(secret, "[مخفي]");
    }
    safeMessage = safeMessage.slice(0, 220);
    return { ok: false, error: safeMessage };
  }
}

/** Read-only diagnostics. This function never calls an order-creation endpoint. */
export async function checkBestRouteConnection(): Promise<BestRouteConnectionCheck> {
  const [areas, subAreas, statuses, orderTypes] = await Promise.all([
    checkList(() => rpcList("/get_areas")),
    checkList(() => rpcList("/get_sub_areas")),
    checkList(() => rpcList("/status")),
    checkOrderTypes(),
  ]);
  return { checkedAt: new Date().toISOString(), areas, subAreas, statuses, orderTypes };
}
