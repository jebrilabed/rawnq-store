"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import s from "./storefront.module.css";
import { translate } from "@/lib/i18n";

export function FaqAccordion({ items, locale }: { items: [string, string][]; locale: string }) {
  const tr = (text: string) => translate(locale, text);
  const [howToOrderOpen, setHowToOrderOpen] = useState(false);
  const howToOrderRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    function checkHash() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.toLowerCase();
      if (hash === "#how-to-order" || hash === "#order-video") {
        setHowToOrderOpen(true);
        setTimeout(() => {
          howToOrderRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      }
    }

    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  if (!items.length) {
    return <p className={s.contentEmpty}>{tr("لا توجد أسئلة شائعة حاليًا.")}</p>;
  }

  return (
    <div className={s.faqAccordion}>
      {items.map(([question, answer], index) => {
        const isHowToOrder =
          index === 0 ||
          question.includes("كيف أطلب") ||
          question.includes("طريقة الطلب") ||
          question.toLowerCase().includes("order");

        return (
          <details
            key={`${index}-${question}`}
            id={isHowToOrder ? "how-to-order" : undefined}
            ref={isHowToOrder ? howToOrderRef : undefined}
            className={s.faqCard}
            open={isHowToOrder ? howToOrderOpen || undefined : undefined}
            onToggle={
              isHowToOrder
                ? (e) => setHowToOrderOpen((e.currentTarget as HTMLDetailsElement).open)
                : undefined
            }
          >
            <summary>
              <span className={s.faqNumber}>{String(index + 1).padStart(2, "0")}</span>
              <span className={s.faqQuestion}>{question}</span>
              <span className={s.faqToggle} aria-hidden="true">+</span>
            </summary>
            <div className={s.faqAnswer}>
              <p>{answer}</p>
              {isHowToOrder && (
                <div className={s.faqVideoWrap}>
                  <div className={s.faqVideoHeader}>
                    <Play size={15} fill="currentColor" aria-hidden="true" />
                    <span>{tr("فيديو توضيحي لطريقة الطلب")}</span>
                  </div>
                  <video
                    controls
                    preload="metadata"
                    playsInline
                    className={s.faqVideo}
                  >
                    <source src="/order/how-to-order.mp4" type="video/mp4" />
                    <source src="/order/My%20movie%2016.mp4" type="video/mp4" />
                    {tr("متصفحك لا يدعم تشغيل الفيديو.")}
                  </video>
                </div>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}
