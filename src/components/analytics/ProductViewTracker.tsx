"use client";

import { useEffect, useRef } from "react";
import { trackViewContent } from "@/lib/analytics/pixel";

type Props = {
  id: string;
  slug: string;
  name: string;
  price: number;
  categoryName?: string;
};

export function ProductViewTracker({ slug, name, price, categoryName }: Props) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;

    trackViewContent({
      content_ids: [slug],
      content_type: "product",
      content_name: name,
      value: price,
      currency: "ILS",
      content_category: categoryName,
    });
  }, [slug, name, price, categoryName]);

  return null;
}
