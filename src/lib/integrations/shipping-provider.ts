import { sendBestRouteOrder } from "@/lib/integrations/best-route-orders";
import { sendTaiarOrder, syncTaiarShipmentStatus } from "@/lib/integrations/taiar-orders";

export type ShippingProviderId = "BEST_ROUTE" | "TAIAR";

export type DispatchOrderOptions = {
  bankPaymentConfirmed?: boolean;
  allowUnconfirmedBankPayment?: boolean;
};

export type DispatchOrderResult = {
  ok: boolean;
  provider: ShippingProviderId;
  state: "SENT" | "REJECTED" | "UNKNOWN" | "SENDING" | "NOT_SENT";
  orderId?: string;
  referenceId?: string;
  error?: string;
};

export type SyncStatusResult = {
  ok: boolean;
  provider: ShippingProviderId;
  providerStatus?: string;
  moneyStatus?: string;
  deliveryFee?: number;
  error?: string;
};

export interface ShippingProvider {
  readonly id: ShippingProviderId;
  readonly name: string;
  isConfigured(): boolean;
  dispatch(orderNumber: string, options?: DispatchOrderOptions): Promise<DispatchOrderResult>;
  syncStatus?(orderNumber: string): Promise<SyncStatusResult>;
}

export class BestRouteProvider implements ShippingProvider {
  readonly id = "BEST_ROUTE" as const;
  readonly name = "Best Route";

  isConfigured(): boolean {
    return Boolean(
      process.env.BEST_ROUTE_LOGIN?.trim() &&
      process.env.BEST_ROUTE_PASSWORD &&
      process.env.BEST_ROUTE_ORDER_TYPE_ID?.trim()
    );
  }

  async dispatch(orderNumber: string, options: DispatchOrderOptions = {}): Promise<DispatchOrderResult> {
    const result = await sendBestRouteOrder(orderNumber, options);
    return {
      ok: result.ok,
      provider: this.id,
      state: result.state as DispatchOrderResult["state"],
      orderId: result.ok ? result.orderId : undefined,
      referenceId: result.ok ? result.referenceId : undefined,
      error: !result.ok ? result.error : undefined,
    };
  }
}

export class TaiarProvider implements ShippingProvider {
  readonly id = "TAIAR" as const;
  readonly name = "طيار (Taiar)";

  isConfigured(): boolean {
    return Boolean(
      process.env.TAIAR_PHONE?.trim() &&
      process.env.TAIAR_PASSWORD &&
      process.env.TAIAR_SENDER_ID?.trim()
    );
  }

  async dispatch(orderNumber: string, options: DispatchOrderOptions = {}): Promise<DispatchOrderResult> {
    const result = await sendTaiarOrder(orderNumber, options);
    return {
      ok: result.ok,
      provider: this.id,
      state: result.state as DispatchOrderResult["state"],
      orderId: result.ok ? result.orderId : undefined,
      referenceId: result.ok ? result.referenceId : undefined,
      error: !result.ok ? result.error : undefined,
    };
  }

  async syncStatus(orderNumber: string): Promise<SyncStatusResult> {
    const result = await syncTaiarShipmentStatus(orderNumber);
    return {
      ok: result.ok,
      provider: this.id,
      providerStatus: result.ok ? result.providerStatus : undefined,
      moneyStatus: result.ok ? result.moneyStatus : undefined,
      deliveryFee: result.ok && result.deliveryFee ? parseFloat(result.deliveryFee) : undefined,
      error: !result.ok ? result.error : undefined,
    };
  }
}

export class ShippingService {
  private static providers: Record<ShippingProviderId, ShippingProvider> = {
    BEST_ROUTE: new BestRouteProvider(),
    TAIAR: new TaiarProvider(),
  };

  static getProvider(id: ShippingProviderId): ShippingProvider {
    const provider = this.providers[id];
    if (!provider) {
      throw new Error(`مزود الشحن غير مدعوم: ${id}`);
    }
    return provider;
  }

  static isConfigured(id: ShippingProviderId): boolean {
    return this.getProvider(id).isConfigured();
  }

  static async dispatchOrder(
    providerId: ShippingProviderId,
    orderNumber: string,
    options?: DispatchOrderOptions
  ): Promise<DispatchOrderResult> {
    const provider = this.getProvider(providerId);
    return provider.dispatch(orderNumber, options);
  }

  static async syncOrderStatus(
    providerId: ShippingProviderId,
    orderNumber: string
  ): Promise<SyncStatusResult> {
    const provider = this.getProvider(providerId);
    if (!provider.syncStatus) {
      return {
        ok: false,
        provider: providerId,
        error: `مزود الشحن ${provider.name} لا يدعم مزامنة الحالة عن بُعد.`,
      };
    }
    return provider.syncStatus(orderNumber);
  }
}

