"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import s from "./NavigationProgress.module.css";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  const spinnerTimer = useRef<NodeJS.Timeout | null>(null);
  const finishTimer = useRef<NodeJS.Timeout | null>(null);
  const activeUrl = useRef<string>("");

  const startProgress = () => {
    if (finishTimer.current) clearTimeout(finishTimer.current);
    if (progressTimer.current) clearTimeout(progressTimer.current);
    if (spinnerTimer.current) clearTimeout(spinnerTimer.current);

    setVisible(true);
    setProgress(20);

    // Increment progress in natural steps
    progressTimer.current = setTimeout(() => {
      setProgress(55);
      progressTimer.current = setTimeout(() => {
        setProgress(78);
        progressTimer.current = setTimeout(() => {
          setProgress(88);
        }, 800);
      }, 400);
    }, 150);

    // Show subtle spinner if navigation takes longer than 200ms
    spinnerTimer.current = setTimeout(() => {
      setShowSpinner(true);
    }, 200);
  };

  const completeProgress = () => {
    if (progressTimer.current) clearTimeout(progressTimer.current);
    if (spinnerTimer.current) clearTimeout(spinnerTimer.current);
    setShowSpinner(false);

    setProgress(100);
    finishTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
  };

  // When pathname or searchParams change, the navigation has completed
  useEffect(() => {
    const currentUrl = `${pathname}?${searchParams?.toString() ?? ""}`;
    if (activeUrl.current && activeUrl.current !== currentUrl) {
      completeProgress();
    }
    activeUrl.current = currentUrl;
  }, [pathname, searchParams]);

  // Intercept internal link clicks for immediate visual response
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor || !anchor.href) return;

      // Ignore download or external target links
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const currentOrigin = window.location.origin;
      const targetUrl = new URL(anchor.href, window.location.href);

      // Must be same origin
      if (targetUrl.origin !== currentOrigin) return;

      // Ignore if clicking exactly current URL (same path + query + hash)
      if (targetUrl.href === window.location.href) return;

      // If it's only a hash change on the same path, don't start progress
      if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search && targetUrl.hash) {
        return;
      }

      startProgress();
    };

    const handlePopState = () => {
      startProgress();
    };

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      if (progressTimer.current) clearTimeout(progressTimer.current);
      if (spinnerTimer.current) clearTimeout(spinnerTimer.current);
      if (finishTimer.current) clearTimeout(finishTimer.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <>
      <div className={s.barContainer} aria-hidden="true">
        <div
          className={`${s.bar} ${progress < 100 ? s.barPending : ""}`}
          style={{
            width: `${progress}%`,
            opacity: visible ? 1 : 0,
          }}
        />
      </div>
      {showSpinner && (
        <div className={s.spinnerIndicator} aria-hidden="true">
          <div className={s.spinnerDot} />
        </div>
      )}
    </>
  );
}
