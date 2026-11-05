import Link from "next/link";
import { Play } from "lucide-react";
import s from "./storefront.module.css";
import { translate } from "@/lib/i18n";

const ITEMS = [
  "توصيل سريع",
  "دفع عند الاستلام",
  "جودة مضمونة",
  "طريقة الطلب (فيديو)",
  "دعم عبر واتساب",
  "تابعنا على إنستغرام",
  "تابعنا على فيسبوك",
];
const REPETITIONS = 4;

function toWhatsAppNumber(value: string) {
  const westernDigits = value.replace(/[٠-٩]/g, (digit) =>
    String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
  );
  return westernDigits.replace(/\D/g, "");
}

function toInstagramUrl(value: string) {
  const account = value.trim().replace(/^@/, "");
  if (!account) return null;
  if (/instagram\.com\//i.test(account)) {
    try {
      const url = new URL(/^https?:\/\//i.test(account) ? account : `https://${account}`);
      if (url.hostname.toLowerCase() === "instagram.com" || url.hostname.toLowerCase() === "www.instagram.com") {
        url.protocol = "https:";
        return url.toString();
      }
    } catch {
      return null;
    }
  }
  return /^[A-Za-z0-9._]+$/.test(account)
    ? `https://www.instagram.com/${encodeURIComponent(account)}/`
    : null;
}

function toFacebookUrl(value: string) {
  const account = value.trim();
  if (!account) return null;
  if (/facebook\.com\//i.test(account) || /fb\.com\//i.test(account)) {
    try {
      const url = new URL(/^https?:\/\//i.test(account) ? account : `https://${account}`);
      url.protocol = "https:";
      return url.toString();
    } catch {
      return null;
    }
  }
  return `https://www.facebook.com/${encodeURIComponent(account.replace(/^@/, ""))}`;
}

export function Marquee({
  locale = "ar",
  whatsapp = "",
  instagram = "",
  facebook = "",
}: {
  locale?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
}) {
  const waNumber = toWhatsAppNumber(whatsapp);
  const waHref = waNumber ? `https://wa.me/${waNumber}` : null;
  const igHref = toInstagramUrl(instagram);
  const fbHref = toFacebookUrl(facebook);

  const renderGroup = (keyPrefix: string, isClone = false) => (
    <div className={s.marqueeGroup} aria-hidden={isClone ? "true" : undefined}>
      {Array.from({ length: REPETITIONS }).flatMap((_, repIdx) =>
        ITEMS.map((item, itemIdx) => {
          const key = `${keyPrefix}-${repIdx}-${itemIdx}`;
          const label = translate(locale, item);

          let href: string | null = null;
          let isVideo = false;
          if (item === "دعم عبر واتساب") {
            href = waHref;
          } else if (item === "تابعنا على إنستغرام") {
            href = igHref;
          } else if (item === "تابعنا على فيسبوك") {
            href = fbHref;
          } else if (item === "طريقة الطلب (فيديو)") {
            href = `/${locale}/page/faq#how-to-order`;
            isVideo = true;
          }

          if (href) {
            const isInternal = href.startsWith("/");
            if (isInternal) {
              return (
                <Link
                  key={key}
                  href={href}
                  className={`${s.marqueeLink} ${isVideo ? s.marqueeVideoLink : ""}`}
                  tabIndex={isClone ? -1 : undefined}
                >
                  {isVideo && (
                    <Play
                      size={12}
                      fill="currentColor"
                      style={{ display: "inline-block", verticalAlign: "middle", marginInlineEnd: 5 }}
                      aria-hidden="true"
                    />
                  )}
                  {label}
                </Link>
              );
            }
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={s.marqueeLink}
                tabIndex={isClone ? -1 : undefined}
              >
                {label}
              </a>
            );
          }
          return <span key={key}>{label}</span>;
        })
      )}
    </div>
  );

  return (
    <div className={s.marquee}>
      <div className={s.track}>
        {renderGroup("g1", false)}
        {renderGroup("g2", true)}
      </div>
    </div>
  );
}
