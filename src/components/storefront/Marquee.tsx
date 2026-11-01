import s from "./storefront.module.css";
import { translate } from "@/lib/i18n";

const ITEMS = ["توصيل سريع", "دفع عند الاستلام", "جودة مضمونة", "دعم عبر واتساب"];

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

  const row = [...ITEMS, ...ITEMS].map((item, i) => {
    const label = translate(locale, item);
    if (item === "دعم عبر واتساب" && waHref) {
      return (
        <a
          key={i}
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={s.marqueeLink}
          aria-hidden="false"
        >
          {label}
        </a>
      );
    }
    return <span key={i}>{label}</span>;
  });

  return (
    <div className={s.marquee}>
      <div className={s.track}>{row}</div>
    </div>
  );
}
