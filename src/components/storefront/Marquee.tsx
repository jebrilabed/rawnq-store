import s from "./storefront.module.css";
import { translate } from "@/lib/i18n";

const ITEMS = ["توصيل سريع", "دفع عند الاستلام", "جودة مضمونة", "دعم عبر واتساب"];
const REPETITIONS = 4;

function toWhatsAppNumber(value: string) {
  const westernDigits = value.replace(/[٠-٩]/g, (digit) =>
    String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
  );
  return westernDigits.replace(/\D/g, "");
}

export function Marquee({
  locale = "ar",
  whatsapp = "",
}: {
  locale?: string;
  whatsapp?: string;
}) {
  const waNumber = toWhatsAppNumber(whatsapp);
  const waHref = waNumber ? `https://wa.me/${waNumber}` : null;

  const renderGroup = (keyPrefix: string, isClone = false) => (
    <div className={s.marqueeGroup} aria-hidden={isClone ? "true" : undefined}>
      {Array.from({ length: REPETITIONS }).flatMap((_, repIdx) =>
        ITEMS.map((item, itemIdx) => {
          const key = `${keyPrefix}-${repIdx}-${itemIdx}`;
          const label = translate(locale, item);
          if (item === "دعم عبر واتساب" && waHref) {
            return (
              <a
                key={key}
                href={waHref}
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
