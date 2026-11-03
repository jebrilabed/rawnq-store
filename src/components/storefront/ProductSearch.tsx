import { Search } from "lucide-react";
import { translate } from "@/lib/i18n";
import s from "./storefront.module.css";

export function ProductSearch({ locale, value = "", category }: { locale: string; value?: string; category?: string }) {
  const tr = (text: string) => translate(locale, text);

  return (
    <form className={s.productSearch} action={`/${locale}/products`} method="get" role="search">
      {category && <input type="hidden" name="category" value={category} />}
      <label className={s.productSearchField}>
        <Search size={20} aria-hidden="true" />
        <input
          name="q"
          type="search"
          defaultValue={value}
          placeholder={tr("ابحث عن منتج")}
          aria-label={tr("بحث")}
        />
      </label>
      <button className={s.productSearchButton} type="submit">
        <Search size={18} aria-hidden="true" />
        {tr("بحث")}
      </button>
    </form>
  );
}
