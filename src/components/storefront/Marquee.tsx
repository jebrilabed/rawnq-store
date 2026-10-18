import s from "./storefront.module.css";

const ITEMS = ["توصيل سريع", "دفع عند الاستلام", "جودة مضمونة", "دعم عبر واتساب"];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className={s.marquee} aria-hidden="true">
      <div className={s.track}>{row.map((t, i) => <span key={i}>{t}</span>)}</div>
    </div>
  );
}
