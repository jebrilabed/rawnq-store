"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, Building2, Check, ShieldCheck, Truck } from "lucide-react";
import { placeOrder, uploadTransferReceiptAction } from "@/app/[locale]/(store)/checkout/actions";
import { formatPrice } from "@/lib/format";
import type { DeliveryArea } from "@/lib/data/db";
import { saveOrder } from "@/lib/orders";
import { useCart } from "./CartProvider";
import { Spinner } from "@/components/ui/LoadingState";
import s from "./storefront.module.css";

type Props = { locale: string; areas: DeliveryArea[]; methods: { cod: boolean; bank: boolean; bankDetails: string } };

export function CheckoutForm({ locale, areas, methods }: Props) {
  const { lines, subtotal, clear } = useCart();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const [deliveryAreaId, setDeliveryAreaId] = useState(areas[0]?.id ?? "");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [receiptPending, setReceiptPending] = useState(false);
  const [payment, setPayment] = useState<"cod" | "bank">(methods.cod ? "cod" : "bank");

  const selectedArea = areas.find((area) => area.id === deliveryAreaId);
  const shipping = selectedArea?.fee ?? 0;

  async function uploadReceipt() {
    if (!receiptFile) { setReceiptError("اختر صورة أو ملف PDF للإيصال."); return; }
    setReceiptPending(true);
    setReceiptError("");
    const form = new FormData();
    form.set("receipt", receiptFile);
    try {
      const result = await uploadTransferReceiptAction(form);
      if (result.ok) setReceiptUrl(result.url);
      else setReceiptError(result.error);
    } catch {
      setReceiptError("تعذر رفع الإيصال. حاول مرة أخرى.");
    } finally {
      setReceiptPending(false);
    }
  }

  if (!lines.length) {
    return (
      <div className={s.empty}>
        <h2>السلة فارغة</h2>
        <Link className={s.btn} href={`/${locale}/products`}>تصفح المنتجات</Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current) return;
    if (!selectedArea) { setError("اختر منطقة التوصيل."); return; }
    if (payment === "bank" && !receiptUrl) { setError("ارفع إيصال التحويل البنكي أولاً."); return; }
    submitting.current = true;
    setPending(true);
    const f = new FormData(e.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "");
    setError("");
    try {
      const res = await placeOrder({
        customer: { name: text("name"), phone: text("phone"), city: text("city"), address: text("address"), notes: text("notes") },
        payment,
        deliveryAreaId,
        paymentReceiptUrl: payment === "bank" ? receiptUrl : undefined,
        lines: lines.map((l) => ({ slug: l.slug, option: l.option, qty: l.qty })),
      });
      if (!res.ok) { setError(res.error); return; }
      saveOrder(res.order);
      clear();
      router.push(`/${locale}/order-confirmation/${res.order.orderNumber}`);
    } catch {
      setError("تعذر إرسال الطلب. حاول مرة أخرى.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form className={`${s.form} ${s.checkoutLayout}`} onSubmit={onSubmit}>
      <div className={s.checkoutFields}>
        <section className={s.checkoutSection}>
          <div className={s.checkoutSectionHeading}>
            <span className={s.checkoutStep}>01</span>
            <div><h2>بيانات التوصيل</h2><p>أدخل معلومات الاستلام وحدد منطقتك.</p></div>
            <Truck size={21} aria-hidden="true" />
          </div>
          <div className={s.checkoutInputGrid}>
            <label className={s.checkoutLabel}>الاسم الكامل
              <input className={s.input} name="name" placeholder="الاسم الكامل" required autoComplete="name" />
            </label>
            <label className={s.checkoutLabel}>رقم الهاتف
              <input className={`${s.input} ${s.phoneInput}`} name="phone" type="tel" placeholder="05xxxxxxxx" required autoComplete="tel" />
            </label>
            <label className={s.checkoutLabel}>المدينة
              <input className={s.input} name="city" placeholder="المدينة" required />
            </label>
            <label className={s.checkoutLabel}>منطقة التوصيل
              <select className={s.input} value={deliveryAreaId} onChange={(event) => setDeliveryAreaId(event.target.value)} required>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.name} · {formatPrice(area.fee)}</option>)}
              </select>
            </label>
            <label className={`${s.checkoutLabel} ${s.checkoutWide}`}>العنوان بالتفصيل
              <textarea className={`${s.input} ${s.checkoutAddress}`} name="address" placeholder="الشارع، الحي، وأقرب معلم" required />
            </label>
            <label className={`${s.checkoutLabel} ${s.checkoutWide}`}>ملاحظات التوصيل <span className={s.optionalLabel}>اختياري</span>
              <textarea className={`${s.input} ${s.checkoutNotes}`} name="notes" rows={2} placeholder="أي تفاصيل تساعدنا في الوصول إليك" />
            </label>
          </div>
        </section>
        <fieldset className={s.radios}>
          <legend className={s.visuallyHidden}>طريقة الدفع</legend>
          <div className={s.checkoutSectionHeading}>
            <span className={s.checkoutStep}>02</span>
            <div><h2>طريقة الدفع</h2><p>اختر الطريقة المناسبة لإكمال طلبك.</p></div>
            <Building2 size={21} aria-hidden="true" />
          </div>
          <div className={s.paymentChoices}>
            {methods.cod && <label className={`${s.paymentChoice} ${payment === "cod" ? s.paymentSelected : ""}`}>
              <input type="radio" name="pay" checked={payment === "cod"} onChange={() => setPayment("cod")} />
              <span className={s.paymentIcon}><Truck size={20} /></span>
              <span className={s.paymentText}><b>الدفع عند التوصيل</b><small>ادفع عند استلام طلبك</small></span>
              <span className={s.paymentCheck}>{payment === "cod" && <Check size={14} />}</span>
            </label>}
            {methods.bank && <label className={`${s.paymentChoice} ${payment === "bank" ? s.paymentSelected : ""}`}>
              <input type="radio" name="pay" checked={payment === "bank"} onChange={() => setPayment("bank")} />
              <span className={s.paymentIcon}><Building2 size={20} /></span>
              <span className={s.paymentText}><b>الدفع الفوري بالتحويل البنكي</b><small>حوّل المبلغ وأرفق إيصال الدفع</small></span>
              <span className={s.paymentCheck}>{payment === "bank" && <Check size={14} />}</span>
            </label>}
          </div>
          {payment === "bank" && methods.bank && (
            <div className={s.transferPanel}>
              <div className={s.bankInfoHeading}><span className={s.paymentIcon}><Building2 size={19} /></span><div><b>معلومات التحويل البنكي</b><p>أكمل التحويل خارج الموقع ثم ارفع الإيصال.</p></div></div>
              <p className={s.transferDetails}>{methods.bankDetails}</p>
              <label className={s.checkoutLabel}>إيصال التحويل (صورة أو PDF، حتى 5 ميغابايت)
                <input className={s.input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => {
                  setReceiptFile(event.target.files?.[0] ?? null);
                  setReceiptUrl("");
                  setReceiptError("");
                }} />
              </label>
              <button className={s.btn} type="button" onClick={() => void uploadReceipt()} disabled={receiptPending || !receiptFile} aria-busy={receiptPending}>
                {receiptPending ? <span className={s.pendingAction}><Spinner /> جارٍ رفع الإيصال…</span> : "رفع الإيصال"}
              </button>
              {receiptUrl && <a className={s.receiptSuccess} href={receiptUrl} target="_blank" rel="noreferrer">تم رفع الإيصال · عرض الملف</a>}
              {receiptError && <p role="alert" className={s.error}>{receiptError}</p>}
            </div>
          )}
        </fieldset>
      </div>
      <aside className={`${s.summary} ${s.checkoutSummary}`}>
        <div className={s.summaryHeader}><div><span>ملخص الطلب</span><h2>{lines.length} منتجات</h2></div><span className={s.summaryMark}><ShieldCheck size={20} /></span></div>
        <div className={s.checkoutOrderItems}>{lines.map((line) => <div key={line.key}><span>{line.name} <small>× {line.qty}</small></span><b>{formatPrice(line.price * line.qty)}</b></div>)}</div>
        <div className={s.summaryDivider} />
        <div><span>المجموع الفرعي</span><b>{formatPrice(subtotal)}</b></div>
        <div><span>التوصيل{selectedArea ? ` · ${selectedArea.name}` : ""}</span><b>{formatPrice(shipping)}</b></div>
        <div className={s.total}><span>الإجمالي</span><b>{formatPrice(subtotal + shipping)}</b></div>
        {error && <p role="alert" className={s.error}>{error}</p>}
        <button className={`${s.btn} ${s.checkoutButton}`} disabled={pending} aria-busy={pending}>
          {pending ? <span className={s.pendingAction}><Spinner /> جارٍ إرسال الطلب…</span> : <>تأكيد الطلب <ArrowLeft size={17} /></>}
        </button>
        <p className={s.checkoutTrust}><ShieldCheck size={15} /> بياناتك محفوظة بأمان</p>
      </aside>
    </form>
  );
}
