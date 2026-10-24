"use client";
import { useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import { Spinner } from "@/components/ui/LoadingState";
import { toast } from "@/components/ui/Toast";
import s from "./storefront.module.css";
import { translate } from "@/lib/i18n";

const unique = (xs: (string | undefined)[]) => Array.from(new Set(xs.filter(Boolean))) as string[];

export function VariantPicker({ product, locale = "ar" }: { product: Product; locale?: string }) {
  const tr = (text: string) => translate(locale, text);
  const { add } = useCart();
  const colors = useMemo(() => unique(product.variants.map((v) => v.color)), [product]);
  const sizes = useMemo(() => unique(product.variants.map((v) => v.size)), [product]);
  const [color, setColor] = useState<string>();
  const [size, setSize] = useState<string>();
  const [pending, setPending] = useState(false);
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

  async function addToCart() {
    if (pending || !ready || stock <= 0) return;
    setPending(true);
    try {
      const option = [color, size].filter(Boolean).join(" / ");
      add({
        key: [product.slug, color, size].filter(Boolean).join("|"),
        slug: product.slug,
        name: product.name,
        image: product.image,
        price,
        option: option || undefined,
        qty: quantity,
      });
      // Short delay for visible smooth feedback
      await new Promise((resolve) => setTimeout(resolve, 220));
      setAdded(true);
      toast.success(tr("تمت إضافة المنتج إلى السلة"));
      setTimeout(() => setAdded(false), 1600);
    } catch {
      toast.error(tr("تعذر إضافة المنتج إلى السلة. حاول مرة أخرى."));
    } finally {
      setPending(false);
    }
  }

  const label = pending
    ? tr("جارٍ الإضافة…")
    : !ready
      ? tr("اختر الخيارات")
      : stock <= 0
        ? tr("غير متوفر")
        : added
          ? tr("تمت الإضافة")
          : tr("أضف إلى السلة");


  return (
    <>
      <div className={s.price} style={{ fontSize: "1.5rem" }}>
        {formatPrice(price, locale)}
        {product.comparePrice && !variant?.price && <s>{formatPrice(product.comparePrice, locale)}</s>}
      </div>
      {colors.length > 0 && (
        <div className={s.group}>
          <b>{tr("اللون")}</b>
          <div className={s.chips}>
            {colors.map((c) => (
              <button key={c} className={s.chip} aria-pressed={color === c} disabled={!colorAvailable(c)} onClick={() => { setColor(c); setQuantity(1); }}>{c}</button>
            ))}
          </div>
        </div>
      )}
      {sizes.length > 0 && (
        <div className={s.group}>
          <b>{tr("الحجم")}</b>
          <div className={s.chips}>
            {sizes.map((z) => (
              <button key={z} className={s.chip} aria-pressed={size === z} disabled={!sizeAvailable(z)} onClick={() => { setSize(z); setQuantity(1); }}>{z}</button>
            ))}
          </div>
        </div>
      )}
      {ready && stock > 0 && stock <= 5 && <p className={s.muted}>{tr("المتوفر:")} {stock}</p>}
      <div className={s.productPurchase}>
        <label className={s.productQuantity}>
          <span>{tr("الكمية")}</span>
          <span className={s.quantityStepper}>
            <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} disabled={!ready || quantity <= 1} aria-label={tr("إنقاص الكمية")}><Minus size={15} /></button>
            <input aria-label={tr("الكمية المطلوبة")} type="number" min={1} max={Math.max(1, quantityLimit)} value={quantity} disabled={!ready || stock <= 0} onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isInteger(value) && value >= 1) setQuantity(Math.min(quantityLimit, value));
            }} />
            <button type="button" onClick={() => setQuantity((current) => Math.min(quantityLimit, current + 1))} disabled={!ready || quantity >= quantityLimit} aria-label={tr("زيادة الكمية")}><Plus size={15} /></button>
          </span>
        </label>
        <button
          className={`${s.btnWide} ${s.productAddButton}`}
          disabled={!ready || stock <= 0 || pending}
          aria-busy={pending}
          onClick={addToCart}
        >
          {pending ? <Spinner /> : added ? <Check size={18} /> : <ShoppingCart size={18} />}
          {label}
        </button>
      </div>
    </>
  );
}
