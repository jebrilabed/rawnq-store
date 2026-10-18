"use client";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { shippingFor } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";
import s from "./storefront.module.css";


export function CartView({ locale, shippingFee, freeFrom }: { locale: string; shippingFee: number; freeFrom: number | null }) {
  const { lines, subtotal, setQty, remove } = useCart();

  if (!lines.length) {
    return (
      <div className={s.empty}>
        <h2>السلة فارغة</h2>
        <Link className={s.btn} href={`/${locale}/products`}>تصفح المنتجات</Link>
      </div>
    );
  }
  return (
    <>
      {lines.map((l) => (
        <div key={l.key} className={s.line}>
          <Image src={l.image} alt="" width={84} height={84} />
          <div className={s.lineBody}>
            <b>{l.name}</b>
            {l.option && <small className={s.muted}>{l.option}</small>}
            <span>{formatPrice(l.price)}</span>
            <div className={s.qty}>
              <button className={s.round} onClick={() => setQty(l.key, l.qty - 1)} aria-label="إنقاص"><Minus size={16} /></button>
              <em>{l.qty}</em>
              <button className={s.round} onClick={() => setQty(l.key, l.qty + 1)} aria-label="زيادة"><Plus size={16} /></button>
            </div>
          </div>
          <button className={s.round} onClick={() => remove(l.key)} aria-label="حذف"><X size={16} /></button>
        </div>
      ))}
      <div className={s.summary}>
        <div><span>المجموع</span><b>{formatPrice(subtotal)}</b></div>
        <div><span>الشحن</span><b>{formatPrice(shippingFor(subtotal, shippingFee, freeFrom))}</b></div>
        <div className={s.total}><span>الإجمالي</span><b>{formatPrice(subtotal + shippingFor(subtotal, shippingFee, freeFrom))}</b></div>
      </div>
      <Link className={s.btn} href={`/${locale}/checkout`}>إتمام الطلب</Link>
    </>
  );
}
