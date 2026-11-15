import type {
  MetaAddPaymentInfoParams,
  MetaAddToCartParams,
  MetaEventOptions,
  MetaInitiateCheckoutParams,
  MetaPurchaseParams,
  MetaRemoveFromCartParams,
  MetaSearchParams,
  MetaViewContentParams,
} from "./types";

const PURCHASE_STORAGE_KEY = "rawnq_tracked_purchases";

/**
 * Returns the configured public Meta Pixel ID or null if missing/empty.
 */
export function getMetaPixelId(): string | null {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  return id && id.length > 0 ? id : null;
}

/**
 * Checks whether Meta Pixel tracking is enabled.
 */
export function isMetaPixelEnabled(): boolean {
  return getMetaPixelId() !== null;
}

/**
 * Internal safe dispatcher for window.fbq.
 * Gracefully ignores calls when running on the server or when the Pixel script is not loaded.
 */
function callFbq(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;

  try {
    const fn = window.fbq as (...params: unknown[]) => void;
    fn(...args);
  } catch (error) {
    // Tracking errors must never interrupt application execution
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Meta Pixel] Dispatch error:", error);
    }
  }
}

/**
 * Updates Meta Pixel consent state ("grant" | "revoke").
 */
export function setMetaPixelConsent(granted: boolean): void {
  callFbq("consent", granted ? "grant" : "revoke");
}

/**
 * Tracks a standard PageView event.
 */
export function trackPageView(options?: MetaEventOptions): void {
  if (options?.eventID) {
    callFbq("track", "PageView", {}, { eventID: options.eventID });
  } else {
    callFbq("track", "PageView");
  }
}

/**
 * Tracks a ViewContent event when viewing a product detail page.
 */
export function trackViewContent(
  params: MetaViewContentParams,
  options?: MetaEventOptions
): void {
  if (options?.eventID) {
    callFbq("track", "ViewContent", params, { eventID: options.eventID });
  } else {
    callFbq("track", "ViewContent", params);
  }
}

/**
 * Tracks a Search event when a customer searches for products.
 */
export function trackSearch(
  params: MetaSearchParams,
  options?: MetaEventOptions
): void {
  if (options?.eventID) {
    callFbq("track", "Search", params, { eventID: options.eventID });
  } else {
    callFbq("track", "Search", params);
  }
}

/**
 * Tracks an AddToCart event after an item is successfully added to the cart.
 */
export function trackAddToCart(
  params: MetaAddToCartParams,
  options?: MetaEventOptions
): void {
  if (options?.eventID) {
    callFbq("track", "AddToCart", params, { eventID: options.eventID });
  } else {
    callFbq("track", "AddToCart", params);
  }
}

/**
 * Tracks a RemoveFromCart custom/standard event when an item is removed.
 */
export function trackRemoveFromCart(
  params: MetaRemoveFromCartParams,
  options?: MetaEventOptions
): void {
  if (options?.eventID) {
    callFbq("trackCustom", "RemoveFromCart", params, { eventID: options.eventID });
  } else {
    callFbq("trackCustom", "RemoveFromCart", params);
  }
}

/**
 * Tracks an InitiateCheckout event when the user enters the checkout flow.
 */
export function trackInitiateCheckout(
  params: MetaInitiateCheckoutParams,
  options?: MetaEventOptions
): void {
  if (options?.eventID) {
    callFbq("track", "InitiateCheckout", params, { eventID: options.eventID });
  } else {
    callFbq("track", "InitiateCheckout", params);
  }
}

/**
 * Tracks an AddPaymentInfo event when payment method is selected or submitted.
 */
export function trackAddPaymentInfo(
  params: MetaAddPaymentInfoParams,
  options?: MetaEventOptions
): void {
  if (options?.eventID) {
    callFbq("track", "AddPaymentInfo", params, { eventID: options.eventID });
  } else {
    callFbq("track", "AddPaymentInfo", params);
  }
}

/**
 * Tracks a Purchase event after order creation and confirmation.
 */
export function trackPurchase(
  params: MetaPurchaseParams,
  options?: MetaEventOptions
): void {
  if (options?.eventID) {
    callFbq("track", "Purchase", params, { eventID: options.eventID });
  } else {
    callFbq("track", "Purchase", params);
  }
}

// ---------------------------------------------------------------------------
// Purchase Deduplication Helper
// ---------------------------------------------------------------------------

/**
 * In-memory fallback set for environments without localStorage/sessionStorage.
 */
const inMemoryTrackedOrders = new Set<string>();

/**
 * Checks if a purchase has already been tracked for this orderNumber.
 */
export function isPurchaseTracked(orderNumber: string): boolean {
  if (!orderNumber) return false;
  if (inMemoryTrackedOrders.has(orderNumber)) return true;

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(PURCHASE_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.includes(orderNumber)) {
          return true;
        }
      }
    } catch {
      // ignore storage access errors
    }
  }

  return false;
}

/**
 * Marks an orderNumber as tracked so subsequent page refreshes do not duplicate the Purchase event.
 */
export function markPurchaseTracked(orderNumber: string): void {
  if (!orderNumber) return;
  inMemoryTrackedOrders.add(orderNumber);

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(PURCHASE_STORAGE_KEY);
      let list: string[] = [];
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          list = parsed.filter((item): item is string => typeof item === "string");
        }
      }
      if (!list.includes(orderNumber)) {
        list.push(orderNumber);
        // Retain at most the last 50 order numbers to keep storage clean
        if (list.length > 50) list = list.slice(list.length - 50);
        localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {
      // ignore storage access errors
    }
  }
}
