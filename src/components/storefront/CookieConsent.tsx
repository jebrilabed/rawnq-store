"use client";

import { useEffect, useState } from "react";
import { setMetaPixelConsent } from "@/lib/analytics/pixel";
import { translate } from "@/lib/i18n";
import s from "./storefront.module.css";

const CONSENT_STORAGE_KEY = "rawnq_cookie_consent";

export function CookieConsent({ locale = "ar" }: { locale?: string }) {
  const tr = (text: string) => translate(locale, text);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored === "accepted") {
        setMetaPixelConsent(true);
      } else if (stored === "declined") {
        setMetaPixelConsent(false);
      } else {
        // No decision made yet -> show banner
        setVisible(true);
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  function handleAccept() {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
    } catch {
      // ignore
    }
    setMetaPixelConsent(true);
    setVisible(false);
  }

  function handleDecline() {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, "declined");
    } catch {
      // ignore
    }
    setMetaPixelConsent(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className={s.cookieBanner}
    >
      <div className={s.cookieContent}>
        <p className={s.cookieText}>
          {tr("نحن نستخدم ملفات تعريف الارتباط لتحسين تجربة التسوق وقياس أداء الإعلانات.")}
        </p>
        <div className={s.cookieActions}>
          <button
            type="button"
            className={`${s.btn} ${s.cookieBtnAccept}`}
            onClick={handleAccept}
          >
            {tr("موافق")}
          </button>
          <button
            type="button"
            className={s.cookieBtnDecline}
            onClick={handleDecline}
          >
            {tr("رفض")}
          </button>
        </div>
      </div>
    </div>
  );
}
