"use client";
import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { customerLoginAction, customerRegisterAction } from "@/app/[locale]/(store)/auth-actions";
import { Spinner } from "@/components/ui/LoadingState";
import { toast } from "@/components/ui/Toast";
import type { DeliveryArea } from "@/lib/data/db";
import s from "./storefront.module.css";
import { translate } from "@/lib/i18n";

function AuthSubmitButton({ isLogin, locale }: { isLogin: boolean; locale: string }) {
  const { pending } = useFormStatus();
  const tr = (text: string) => translate(locale, text);
  const pendingLabel = isLogin ? tr("جارٍ تسجيل الدخول…") : tr("جارٍ إنشاء الحساب…");
  return (
    <button type="submit" className={s.btn} disabled={pending} aria-busy={pending}>
      {pending ? <span className={s.pendingAction}><Spinner /> {pendingLabel}</span> : isLogin ? tr("دخول") : tr("إنشاء الحساب")}
    </button>
  );
}

export function AuthForm({ mode, locale, error, next, courierAreas = [], deliveryAreas = [] }: {
  mode: "login" | "register";
  locale: string;
  error?: string;
  next?: string;
  courierAreas?: string[];
  deliveryAreas?: DeliveryArea[];
}) {
  const tr = (text: string) => translate(locale, text);
  const [msg, setMsg] = useState("");
  const isLogin = mode === "login";
  const errorMessage = error === "credentials"
    ? tr("البريد الإلكتروني أو كلمة المرور غير صحيحة.")
    : error === "exists"
      ? tr("يوجد حساب مسجل بهذا البريد الإلكتروني.")
      : error === "invalid"
        ? tr("تحقق من جميع البيانات المطلوبة قبل إنشاء الحساب.")
        : "";
  return (
    <form className={`${s.form} ${s.authForm}`} action={isLogin ? customerLoginAction : customerRegisterAction} onSubmit={(e) => {
      const form = new FormData(e.currentTarget);
      if (!isLogin && form.get("password") !== form.get("confirmPassword")) {
        e.preventDefault();
        const errText = tr("كلمتا المرور غير متطابقتين.");
        setMsg(errText);
        toast.warning(errText);
      }
    }}>

      <input type="hidden" name="locale" value={locale} />
      {isLogin && (next === "orders" || next === "profile" || next === "admin") && <input type="hidden" name="next" value={next} />}
      {!isLogin && <input className={s.input} name="name" placeholder={tr("الاسم الكامل")} required autoComplete="name" />}
      <input className={`${s.input} ${s.emailInput}`} name="email" type="email" placeholder={tr("البريد الإلكتروني")} required autoComplete="email" dir="ltr" />
      {!isLogin && <input className={`${s.input} ${s.phoneInput}`} name="phone" type="tel" placeholder={tr("رقم الهاتف")} required autoComplete="tel" />}
      {!isLogin && (
        <label className={s.authFieldLabel}>{tr("المدينة / المنطقة")}
          <select className={s.input} name="city" defaultValue="" required autoComplete="address-level2">
            <option value="" disabled>{tr("اختر المدينة أو المنطقة")}</option>
            {courierAreas.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>
      )}
      {!isLogin && (
        <label className={s.authFieldLabel}>{tr("منطقة التوصيل")}
          <select className={s.input} name="deliveryAreaName" defaultValue="" required>
            <option value="" disabled>{tr("اختر منطقة التوصيل.")}</option>
            {deliveryAreas.map((area) => <option key={area.value} value={area.value}>{area.name}</option>)}
          </select>
        </label>
      )}
      {!isLogin && <textarea className={`${s.input} ${s.authAddress}`} name="address" placeholder={tr("العنوان بالتفصيل")} required minLength={4} autoComplete="street-address" />}
      <input className={s.input} name="password" type="password" placeholder={tr("كلمة المرور")} required minLength={isLogin ? undefined : 8} maxLength={128} autoComplete={isLogin ? "current-password" : "new-password"} />
      {!isLogin && <input className={s.input} name="confirmPassword" type="password" placeholder={tr("تأكيد كلمة المرور")} required minLength={8} maxLength={128} autoComplete="new-password" />}
      {(msg || errorMessage) && <p role="alert" className={s.error}>{msg || errorMessage}</p>}
      <AuthSubmitButton isLogin={isLogin} locale={locale} />
      <p className={s.muted}>
        {tr(isLogin ? "ليس لديك حساب؟ " : "لديك حساب؟ ")}
        <Link className={s.link} href={`/${locale}/${isLogin ? "register" : "login"}`}>{tr(isLogin ? "إنشاء حساب جديد" : "تسجيل الدخول")}</Link>
      </p>
    </form>
  );
}
