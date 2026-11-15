"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics/pixel";

export function PageViewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrl = useRef<string | null>(null);

  useEffect(() => {
    const search = searchParams?.toString();
    const currentUrl = `${pathname}${search ? `?${search}` : ""}`;

    // Prevent duplicate PageView events for the exact same URL
    if (lastTrackedUrl.current === currentUrl) return;
    lastTrackedUrl.current = currentUrl;

    trackPageView();
  }, [pathname, searchParams]);

  return null;
}
