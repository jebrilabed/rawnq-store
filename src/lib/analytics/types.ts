/**
 * Meta Pixel & Conversions API (CAPI) TypeScript Definitions
 */

export type MetaContentItem = {
  id: string;
  quantity: number;
  item_price: number;
};

export type MetaEventOptions = {
  eventID?: string;
};

export type MetaViewContentParams = {
  content_ids: string[];
  content_type: "product";
  content_name: string;
  value: number;
  currency: string;
  content_category?: string;
};

export type MetaSearchParams = {
  search_string: string;
  content_type?: "product";
};

export type MetaAddToCartParams = {
  content_ids: string[];
  content_type: "product";
  content_name: string;
  value: number;
  currency: string;
  quantity: number;
};

export type MetaRemoveFromCartParams = {
  content_ids: string[];
  content_type: "product";
  content_name: string;
  value: number;
  currency: string;
  quantity: number;
};

export type MetaInitiateCheckoutParams = {
  content_ids: string[];
  contents: MetaContentItem[];
  content_type: "product";
  value: number;
  currency: string;
  num_items: number;
};

export type MetaAddPaymentInfoParams = {
  value?: number;
  currency?: string;
  payment_type?: string;
  content_type?: "product";
  contents?: MetaContentItem[];
};

export type MetaPurchaseParams = {
  content_ids: string[];
  contents: MetaContentItem[];
  content_type: "product";
  value: number;
  currency: string;
  num_items: number;
  order_id: string;
};

export interface MetaPixelFbq {
  (action: "init", pixelId: string, userData?: Record<string, unknown>): void;
  (action: "track", eventName: "PageView", params?: Record<string, unknown>, options?: MetaEventOptions): void;
  (action: "track", eventName: "ViewContent", params: MetaViewContentParams, options?: MetaEventOptions): void;
  (action: "track", eventName: "Search", params: MetaSearchParams, options?: MetaEventOptions): void;
  (action: "track", eventName: "AddToCart", params: MetaAddToCartParams, options?: MetaEventOptions): void;
  (action: "track", eventName: "InitiateCheckout", params: MetaInitiateCheckoutParams, options?: MetaEventOptions): void;
  (action: "track", eventName: "AddPaymentInfo", params: MetaAddPaymentInfoParams, options?: MetaEventOptions): void;
  (action: "track", eventName: "Purchase", params: MetaPurchaseParams, options?: MetaEventOptions): void;
  (action: "trackCustom", eventName: string, params?: Record<string, unknown>, options?: MetaEventOptions): void;
  (action: "consent", consentState: "grant" | "revoke"): void;
  (action: string, ...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
}

declare global {
  interface Window {
    fbq?: MetaPixelFbq;
    _fbq?: MetaPixelFbq;
  }
}
