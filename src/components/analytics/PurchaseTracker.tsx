"use client";

import { useEffect, useRef } from "react";
import type { OrderSummary } from "@/lib/orders";
import { isPurchaseTracked, markPurchaseTracked, trackPurchase } from "@/lib/analytics/pixel";

type Props = {
  order: OrderSummary;
};

export function PurchaseTracker({ order }: Props) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!order?.orderNumber) return;
    if (trackedRef.current) return;
    if (isPurchaseTracked(order.orderNumber)) return;

    trackedRef.current = true;
    markPurchaseTracked(order.orderNumber);

    const contents = order.items.map((item) => ({
      id: item.slug,
      quantity: item.qty,
      item_price: item.unitPrice,
    }));

    const contentIds = order.items.map((item) => item.slug);
    const numItems = order.items.reduce((sum, item) => sum + item.qty, 0);

    trackPurchase(
      {
        content_ids: contentIds,
        contents,
        content_type: "product",
        value: order.total,
        currency: "ILS",
        num_items: numItems,
        order_id: order.orderNumber,
      },
      {
        eventID: `order_${order.orderNumber}`,
      }
    );
  }, [order]);

  return null;
}
