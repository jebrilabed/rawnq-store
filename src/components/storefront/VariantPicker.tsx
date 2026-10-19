"use client";
import { useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import s from "./storefront.module.css";

const unique = (xs: (string | undefined)[]) => Array.from(new Set(xs.filter(Boolean))) as string[];

export function VariantPicker({ product }: { product: Product }) {
  const { add } = useCart();
  const colors = useMemo(() => unique(product.variants.map((v) => v.color)), [product]);
  const sizes = useMemo(() => unique(product.variants.map((v) => v.size)), [product]);
  const [color, setColor] = useState<string>();
  const [size, setSize] = useState<string>();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const hasVariants = product.variants.length > 0;
  const ready = (!colors.length || !!color) && (!sizes.length || !!size);
  const variant = hasVariants ? product.variants.find((v) => v.color === color && v.size === size) : undefined;
  const stock = hasVariants ? variant?.stock ?? 0 : product.stock;
  const price = variant?.price ?? product.price;
  const quantityLimit = Math.min(99, stock);

  const colorAvailable = (c: string) => product.variants.some((v) => v.color === c && (!size || v.size === size) && v.stock > 0);
  const sizeAvailable = (z: string) => product.variants.some((v) => v.size === z && (!color || v.color === color) && v.stock > 0);

  function addToCart() {
    const option = [color, size].filter(Boolean).join(" / ");
    add({ key: [product.slug, color, size].filter(Boolean).join("|"), slug: product.slug, name: product.name, image: product.image, price, option: option || undefined, qty: quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  const label = !ready ? "اختر الخيارات" : stock <= 0 ? "غير متوفر" : added ? "تمت الإضافة" : "أضف إلى السلة";

  return (
    <>
      <div className={s.price} style={{ fontSize: "1.5rem" }}>
        {formatPrice(price)}
        {product.comparePrice && !variant?.price && <s>{formatPrice(product.comparePrice)}</s>}
      </div>
      {colors.length > 0 && (
        <div className={s.group}>
          <b>اللون</b>
          <div className={s.chips}>
            {colors.map((c) => (
              <button key={c} className={s.chip} aria-pressed={color === c} disabled={!colorAvailable(c)} onClick={() => { setColor(c); setQuantity(1); }}>{c}</button>
            ))}
          </div>
        </div>
      )}
      {sizes.length > 0 && (
        <div className={s.group}>
          <b>الحجم</b>
          <div className={s.chips}>
            {sizes.map((z) => (
              <button key={z} className={s.chip} aria-pressed={size === z} disabled={!sizeAvailable(z)} onClick={() => { setSize(z); setQuantity(1); }}>{z}</button>
            ))}
          </div>
        </div>
      )}
      {ready && stock > 0 && stock <= 5 && <p className={s.muted}>المتوفر: {stock} فقط</p>}
      <div className={s.productPurchase}>
        <label className={s.productQuantity}>
          <span>الكمية</span>
          <span className={s.quantityStepper}>
            <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} disabled={!ready || quantity <= 1} aria-label="تقليل الكمية"><Minus size={15} /></button>
            <input aria-label="الكمية المطلوبة" type="number" min={1} max={Math.max(1, quantityLimit)} value={quantity} disabled={!ready || stock <= 0} onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isInteger(value) && value >= 1) setQuantity(Math.min(quantityLimit, value));
            }} />
            <button type="button" onClick={() => setQuantity((current) => Math.min(quantityLimit, current + 1))} disabled={!ready || quantity >= quantityLimit} aria-label="زيادة الكمية"><Plus size={15} /></button>
          </span>
        </label>
        <button className={`${s.btnWide} ${s.productAddButton}`} disabled={!ready || stock <= 0} onClick={addToCart}>
          {added ? <Check size={18} /> : <ShoppingCart size={18} />}
          {label}
        </button>
      </div>
    </>
  );
}
