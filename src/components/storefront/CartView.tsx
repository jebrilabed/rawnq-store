"use client";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBasket, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";
import s from "./storefront.module.css";


export function CartView({ locale }: { locale: string }) {
  const { lines, count, subtotal, setQty, remove } = useCart();

  if (!lines.length) {
    return (
      <div className={s.emptyStatePage}>
        <span className={s.emptyIcon}><ShoppingBasketIcon /></span>
        <h2>سلتك بانتظار اختياراتك</h2>
        <p>تصفح منتجات البيت وأضف ما تحتاجه، وستجد ملخص طلبك هنا.</p>
        <Link className={s.btn} href={`/${locale}/products`}>ابدأ التسوق</Link>
      </div>
    );
  }
  return (
    <div className={s.cartLayout}>
      <div className={s.cartItems}>
        <div className={s.cartItemsHeader}><strong>منتجاتك</strong><span>{lines.length} منتجات · {count} قطع</span></div>
        {lines.map((l) => (
          <div key={l.key} className={s.cartLine}>
            <Image src={l.image} alt="" width={88} height={88} />
            <div className={s.cartLineInfo}>
              <b>{l.name}</b>
              {l.option && <small>{l.option}</small>}
              <span className={s.muted}>{formatPrice(l.price)} للقطعة</span>
            </div>
            <div className={s.cartLineSide}>
              <b>{formatPrice(l.price * l.qty)}</b>
              <div className={s.cartActions}>
                <div className={s.quantityControl} aria-label={`الكمية ${l.qty}`}>
                  <button type="button" onClick={() => setQty(l.key, l.qty - 1)} aria-label="إنقاص الكمية"><Minus size={15} /></button>
                  <span>{l.qty}</span>
                  <button type="button" onClick={() => setQty(l.key, l.qty + 1)} disabled={l.qty >= 99} aria-label="زيادة الكمية"><Plus size={15} /></button>
                </div>
                <button type="button" className={s.removeItem} onClick={() => remove(l.key)} aria-label={`حذف ${l.name}`}><X size={17} /><span>حذف</span></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <aside className={`${s.summary} ${s.cartSummary}`}>
        <h2>ملخص السلة</h2>
        <div><span>عدد القطع</span><b>{count}</b></div>
        <div><span>المجموع الفرعي</span><b>{formatPrice(subtotal)}</b></div>
        <div><span>التوصيل</span><b>يُحدد عند الدفع</b></div>
        <div className={s.total}><span>المجموع الحالي</span><b>{formatPrice(subtotal)}</b></div>
        <p className={s.summaryNote}>تُضاف رسوم التوصيل بعد اختيار المنطقة.</p>
        <Link className={`${s.btn} ${s.checkoutButton}`} href={`/${locale}/checkout`}>إتمام الطلب</Link>
        <Link className={s.continueShopping} href={`/${locale}/products`}>متابعة التسوق</Link>
      </aside>
    </div>
  );
}

function ShoppingBasketIcon() {
  return <ShoppingBasket size={31} strokeWidth={1.5} aria-hidden="true" />;
}
