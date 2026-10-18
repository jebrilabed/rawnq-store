"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { placeOrder } from "@/app/[locale]/(store)/checkout/actions";
import { shippingFor } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { saveOrder } from "@/lib/orders";
import { useCart } from "./CartProvider";
import s from "./storefront.module.css";

type Props = { locale: string; shippingFee: number; freeFrom: number | null; methods: { cod: boolean; bank: boolean; bankDetails: string } };

export function CheckoutForm({ locale, shippingFee, freeFrom, methods }: Props) {
  const { lines, subtotal, clear } = useCart();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<"cod" | "bank">(methods.cod ? "cod" : "bank");

  const shipping = shippingFor(subtotal, shippingFee, freeFrom);

  if (!lines.length) {
    return (
      <div className={s.empty}>
        <h2>السلة فارغة</h2>
        <Link className={s.btn} href={`/${locale}/products`}>تصفح المنتجات</Link>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "");
    setError("");
    start(async () => {
      const res = await placeOrder({
        customer: { name: text("name"), phone: text("phone"), city: text("city"), address: text("address"), notes: text("notes") },
        payment,
        lines: lines.map((l) => ({ slug: l.slug, option: l.option, qty: l.qty })),
      });
      if (!res.ok) { setError(res.error); return; }
      saveOrder(res.order);
      clear();
      router.push(`/${locale}/order-confirmation/${res.order.orderNumber}`);
    });
  }

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <input className={s.input} name="name" placeholder="الاسم الكامل" required autoComplete="name" />
      <input className={s.input} name="phone" type="tel" placeholder="رقم الهاتف" required autoComplete="tel" />
      <input className={s.input} name="city" placeholder="المدينة" required />
      <input className={s.input} name="address" placeholder="العنوان بالتفصيل" required />
      <textarea className={s.input} name="notes" rows={2} placeholder="ملاحظات (اختياري)" />
      <fieldset className={s.radios}>
        <legend>طريقة الدفع</legend>
        {methods.cod && <label><input type="radio" name="pay" checked={payment === "cod"} onChange={() => setPayment("cod")} /> الدفع عند الاستلام</label>}
        {methods.bank && <label><input type="radio" name="pay" checked={payment === "bank"} onChange={() => setPayment("bank")} /> تحويل بنكي</label>}
        {payment === "bank" && methods.bankDetails && <p className={s.muted}>{methods.bankDetails}</p>}
      </fieldset>
      <div className={s.summary}>
        <div><span>المجموع</span><b>{formatPrice(subtotal)}</b></div>
        <div><span>الشحن</span><b>{formatPrice(shipping)}</b></div>
        <div className={s.total}><span>الإجمالي</span><b>{formatPrice(subtotal + shipping)}</b></div>
      </div>
      {error && <p role="alert" className={s.error}>{error}</p>}
      <button className={s.btn} disabled={pending}>{pending ? "جارٍ إرسال الطلب…" : "تأكيد الطلب"}</button>
    </form>
  );
}
