"use client";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBasket, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";
import s from "./storefront.module.css";
import { translate } from "@/lib/i18n";


export function CartView({ locale }: { locale: string }) {
  const tr = (text: string) => translate(locale, text);
  const { lines, count, subtotal, setQty, remove } = useCart();

  if (!lines.length) {
    return (
      <div className={s.emptyStatePage}>
        <span className={s.emptyIcon}><ShoppingBasketIcon /></span>
        <h2>{tr("سلتك بانتظار اختياراتك")}</h2>
        <p>{tr("تصفح منتجات البيت وأضف ما تحتاجه، وستجد ملخص طلبك هنا.")}</p>
        <Link className={s.btn} href={`/${locale}/products`}>{tr("ابدأ التسوق")}</Link>
      </div>
    );
  }
  return (
    <div className={s.cartLayout}>
      <div className={s.cartItems}>
        <div className={s.cartItemsHeader}><strong>{tr("منتجاتك")}</strong><span>{lines.length} · {count} {tr("قطع")}</span></div>
        {lines.map((l) => (
          <div key={l.key} className={s.cartLine}>
            <Image src={l.image} alt="" width={88} height={88} />
            <div className={s.cartLineInfo}>
              <b>{tr(l.name)}</b>
              {l.option && <small>{tr(l.option)}</small>}
              <span className={s.muted}>{formatPrice(l.price, locale)} {tr("للقطعة")}</span>
            </div>
            <div className={s.cartLineSide}>
              <b>{formatPrice(l.price * l.qty, locale)}</b>
              <div className={s.cartActions}>
                <div className={s.quantityControl} aria-label={`${tr("الكمية")} ${l.qty}`}>
                  <button type="button" onClick={() => setQty(l.key, l.qty - 1)} aria-label={tr("إنقاص الكمية")}><Minus size={15} /></button>
                  <span>{l.qty}</span>
                  <button type="button" onClick={() => setQty(l.key, l.qty + 1)} disabled={l.qty >= 99} aria-label={tr("زيادة الكمية")}><Plus size={15} /></button>
                </div>
                <button type="button" className={s.removeItem} onClick={() => remove(l.key)} aria-label={`${tr("حذف")} ${l.name}`}><X size={17} /><span>{tr("حذف")}</span></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <aside className={`${s.summary} ${s.cartSummary}`}>
        <h2>{tr("ملخص السلة")}</h2>
        <div><span>{tr("عدد القطع")}</span><b>{count}</b></div>
        <div><span>{tr("المجموع الفرعي")}</span><b>{formatPrice(subtotal, locale)}</b></div>
        <div><span>{tr("التوصيل")}</span><b>{tr("يُحدد عند الدفع")}</b></div>
        <div className={s.total}><span>{tr("المجموع الحالي")}</span><b>{formatPrice(subtotal, locale)}</b></div>
        <p className={s.summaryNote}>{tr("تُضاف رسوم التوصيل بعد اختيار المنطقة.")}</p>
        <Link className={`${s.btn} ${s.checkoutButton}`} href={`/${locale}/checkout`}>{tr("إتمام الطلب")}</Link>
        <Link className={s.continueShopping} href={`/${locale}/products`}>{tr("متابعة التسوق")}</Link>
      </aside>
    </div>
  );
}

function ShoppingBasketIcon() {
  return <ShoppingBasket size={31} strokeWidth={1.5} aria-hidden="true" />;
}
