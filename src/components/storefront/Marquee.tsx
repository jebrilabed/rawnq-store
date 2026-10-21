import s from "./storefront.module.css";
import { translate } from "@/lib/i18n";

const ITEMS = ["توصيل سريع", "دفع عند الاستلام", "جودة مضمونة", "دعم عبر واتساب"];

export function Marquee({ locale = "ar" }: { locale?: string }) {
  const items = ITEMS.map((item) => translate(locale, item));
  const row = [...items, ...items];
  return (
    <div className={s.marquee} aria-hidden="true">
      <div className={s.track}>{row.map((t, i) => <span key={i}>{t}</span>)}</div>
    </div>
  );
}
