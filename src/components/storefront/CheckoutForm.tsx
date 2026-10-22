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
import { translate } from "@/lib/i18n";

type Props = {
  locale: string;
  areas: DeliveryArea[];
  courierAreas: string[];
  customer?: { name: string; phone: string; city: string; address: string; deliveryAreaName: string | null };
  methods: { cod: boolean; bank: boolean; bankDetails: string };
};

export function CheckoutForm({ locale, areas, courierAreas, customer, methods }: Props) {
  const tr = (text: string) => translate(locale, text);
  const { lines, subtotal, clear } = useCart();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const preferredArea = areas.find((area) => area.value === customer?.deliveryAreaName);
  const [deliveryAreaId, setDeliveryAreaId] = useState(preferredArea?.id ?? areas[0]?.id ?? "");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [receiptPending, setReceiptPending] = useState(false);
  const [payment, setPayment] = useState<"cod" | "bank">(methods.cod ? "cod" : "bank");

  const selectedArea = areas.find((area) => area.id === deliveryAreaId);
  const shipping = selectedArea?.fee ?? 0;

  async function uploadReceipt() {
    if (!receiptFile) { setReceiptError(tr("اختر صورة أو ملف PDF للإيصال.")); return; }
    setReceiptPending(true);
    setReceiptError("");
    const form = new FormData();
    form.set("receipt", receiptFile);
    try {
      const result = await uploadTransferReceiptAction(form);
      if (result.ok) setReceiptUrl(result.url);
      else setReceiptError(tr(result.error));
    } catch {
      setReceiptError(tr("تعذر رفع الإيصال. حاول مرة أخرى."));
    } finally {
      setReceiptPending(false);
    }
  }

  if (!lines.length) {
    return (
      <div className={s.empty}>
        <h2>{tr("السلة فارغة")}</h2>
        <Link className={s.btn} href={`/${locale}/products`}>{tr("تصفح المنتجات")}</Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current) return;
    if (!selectedArea) { setError(tr("اختر منطقة التوصيل.")); return; }
    if (payment === "bank" && !receiptUrl) { setError(tr("ارفع إيصال التحويل البنكي أولاً.")); return; }
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
      if (!res.ok) { setError(tr(res.error)); return; }
      saveOrder(res.order);
      clear();
      router.push(`/${locale}/order-confirmation/${res.order.orderNumber}${res.deliverySent ? "" : "?delivery=pending"}`);
    } catch {
      setError(tr("تعذر إرسال الطلب. حاول مرة أخرى."));
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
            <div><h2>{tr("بيانات التوصيل")}</h2><p>{tr("أدخل معلومات الاستلام وحدد منطقتك.")}</p></div>
            <Truck size={21} aria-hidden="true" />
          </div>
          <div className={s.checkoutInputGrid}>
            <label className={s.checkoutLabel}>{tr("الاسم الكامل")}
              <input className={s.input} name="name" placeholder={tr("الاسم الكامل")} defaultValue={customer?.name} required autoComplete="name" />
            </label>
            <label className={s.checkoutLabel}>{tr("رقم الهاتف")}
              <input className={`${s.input} ${s.phoneInput}`} name="phone" type="tel" placeholder="05xxxxxxxx" defaultValue={customer?.phone} required autoComplete="tel" />
            </label>
            <label className={s.checkoutLabel}>{tr("المدينة / المنطقة")}
              <select className={s.input} name="city" defaultValue={courierAreas.includes(customer?.city ?? "") ? customer?.city : ""} required>
                <option value="" disabled>{tr("اختر المدينة أو المنطقة")}</option>
                {courierAreas.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </label>
            <label className={s.checkoutLabel}>{tr("منطقة التوصيل")}
              <select className={s.input} value={deliveryAreaId} onChange={(event) => setDeliveryAreaId(event.target.value)} required>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.name} · {formatPrice(area.fee, locale)}</option>)}
              </select>
            </label>
            <label className={`${s.checkoutLabel} ${s.checkoutWide}`}>{tr("العنوان بالتفصيل")}
              <textarea className={`${s.input} ${s.checkoutAddress}`} name="address" placeholder={tr("الشارع، الحي، وأقرب معلم")} defaultValue={customer?.address} required />
            </label>
            <label className={`${s.checkoutLabel} ${s.checkoutWide}`}>{tr("ملاحظات التوصيل")} <span className={s.optionalLabel}>{tr("اختياري")}</span>
              <textarea className={`${s.input} ${s.checkoutNotes}`} name="notes" rows={2} placeholder={tr("أي تفاصيل تساعدنا في الوصول إليك")} />
            </label>
          </div>
        </section>
        <fieldset className={s.radios}>
          <legend className={s.visuallyHidden}>{tr("طريقة الدفع")}</legend>
          <div className={s.checkoutSectionHeading}>
            <span className={s.checkoutStep}>02</span>
            <div><h2>{tr("طريقة الدفع")}</h2><p>{tr("اختر الطريقة المناسبة لإكمال طلبك.")}</p></div>
            <Building2 size={21} aria-hidden="true" />
          </div>
          <div className={s.paymentChoices}>
            {methods.cod && <label className={`${s.paymentChoice} ${payment === "cod" ? s.paymentSelected : ""}`}>
              <input type="radio" name="pay" checked={payment === "cod"} onChange={() => setPayment("cod")} />
              <span className={s.paymentIcon}><Truck size={20} /></span>
              <span className={s.paymentText}><b>{tr("الدفع عند التوصيل")}</b><small>{tr("ادفع عند استلام طلبك")}</small></span>
              <span className={s.paymentCheck}>{payment === "cod" && <Check size={14} />}</span>
            </label>}
            {methods.bank && <label className={`${s.paymentChoice} ${payment === "bank" ? s.paymentSelected : ""}`}>
              <input type="radio" name="pay" checked={payment === "bank"} onChange={() => setPayment("bank")} />
              <span className={s.paymentIcon}><Building2 size={20} /></span>
              <span className={s.paymentText}><b>{tr("الدفع الفوري بالتحويل البنكي")}</b><small>{tr("حوّل المبلغ وأرفق إيصال الدفع")}</small></span>
              <span className={s.paymentCheck}>{payment === "bank" && <Check size={14} />}</span>
            </label>}
          </div>
          {payment === "bank" && methods.bank && (
            <div className={s.transferPanel}>
              <div className={s.bankInfoHeading}><span className={s.paymentIcon}><Building2 size={19} /></span><div><b>{tr("معلومات التحويل البنكي")}</b><p>{tr("أكمل التحويل خارج الموقع ثم ارفع الإيصال.")}</p></div></div>
              <p className={s.transferDetails}>{methods.bankDetails}</p>
              <label className={s.checkoutLabel}>{tr("إيصال التحويل (صورة أو PDF، حتى 5 ميغابايت)")}
                <input className={s.input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => {
                  setReceiptFile(event.target.files?.[0] ?? null);
                  setReceiptUrl("");
                  setReceiptError("");
                }} />
              </label>
              <button className={s.btn} type="button" onClick={() => void uploadReceipt()} disabled={receiptPending || !receiptFile} aria-busy={receiptPending}>
                {receiptPending ? <span className={s.pendingAction}><Spinner /> {tr("جارٍ رفع الإيصال…")}</span> : tr("رفع الإيصال")}
              </button>
              {receiptUrl && <a className={s.receiptSuccess} href={receiptUrl} target="_blank" rel="noreferrer">{tr("تم رفع الإيصال · عرض الملف")}</a>}
              {receiptError && <p role="alert" className={s.error}>{receiptError}</p>}
            </div>
          )}
        </fieldset>
      </div>
      <aside className={`${s.summary} ${s.checkoutSummary}`}>
        <div className={s.summaryHeader}><div><span>{tr("ملخص الطلب")}</span><h2>{lines.length} {tr("منتجات")}</h2></div><span className={s.summaryMark}><ShieldCheck size={20} /></span></div>
        <div className={s.checkoutOrderItems}>{lines.map((line) => <div key={line.key}><span>{tr(line.name)} <small>× {line.qty}</small></span><b>{formatPrice(line.price * line.qty, locale)}</b></div>)}</div>
        <div className={s.summaryDivider} />
        <div><span>{tr("المجموع الفرعي")}</span><b>{formatPrice(subtotal, locale)}</b></div>
        <div><span>{tr("التوصيل")}{selectedArea ? ` · ${selectedArea.name}` : ""}</span><b>{formatPrice(shipping, locale)}</b></div>
        <div className={s.total}><span>{tr("الإجمالي")}</span><b>{formatPrice(subtotal + shipping, locale)}</b></div>
        {error && <p role="alert" className={s.error}>{error}</p>}
        <button className={`${s.btn} ${s.checkoutButton}`} disabled={pending} aria-busy={pending}>
          {pending ? <span className={s.pendingAction}><Spinner /> {tr("جارٍ إرسال الطلب…")}</span> : <>{tr("تأكيد الطلب")} <ArrowLeft size={17} /></>}
        </button>
        <p className={s.checkoutTrust}><ShieldCheck size={15} /> {tr("بياناتك محفوظة بأمان")}</p>
      </aside>
    </form>
  );
}
