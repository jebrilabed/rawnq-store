"use client";

import { useEffect, useRef } from "react";
import { trackSearch } from "@/lib/analytics/pixel";

type Props = {
  query: string;
};

export function SearchTracker({ query }: Props) {
  const lastTrackedQuery = useRef<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || lastTrackedQuery.current === trimmed) return;
    lastTrackedQuery.current = trimmed;

    trackSearch({
      search_string: trimmed,
      content_type: "product",
    });
  }, [query]);

  return null;
}
