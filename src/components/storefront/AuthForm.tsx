"use client";
import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ShoppingBag } from "lucide-react";
import { customerLoginAction, customerRegisterAction } from "@/app/[locale]/(store)/auth-actions";
import { Spinner } from "@/components/ui/LoadingState";
import { PasswordInput } from "@/components/ui/PasswordInput";
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

export function AuthForm({ mode, locale, error, next, reason, courierAreas = [], deliveryAreas = [] }: {
  mode: "login" | "register";
  locale: string;
  error?: string;
  next?: string;
  reason?: string;
  courierAreas?: string[];
  deliveryAreas?: DeliveryArea[];
}) {
  const tr = (text: string) => translate(locale, text);
  const [msg, setMsg] = useState("");
  const isLogin = mode === "login";
  const isAdminLogin = isLogin && next === "admin";
  const errorMessage = error === "credentials"
    ? tr(isAdminLogin ? "اسم المستخدم أو كلمة المرور غير صحيحة." : "البريد الإلكتروني أو كلمة المرور غير صحيحة.")
    : error === "exists"
      ? tr("يوجد حساب مسجل بهذا البريد الإلكتروني.")
      : error === "invalid"
        ? tr("تحقق من جميع البيانات المطلوبة قبل إنشاء الحساب.")
        : "";

  const toggleQuery = new URLSearchParams();
  if (next) toggleQuery.set("next", next);
  if (reason) toggleQuery.set("reason", reason);
  const toggleQueryStr = toggleQuery.toString();
  const toggleHref = `/${locale}/${isLogin ? "register" : "login"}${toggleQueryStr ? `?${toggleQueryStr}` : ""}`;

  return (
    <form className={`${s.form} ${s.authForm}`} action={isLogin ? customerLoginAction : customerRegisterAction} onSubmit={(e) => {
      const form = new FormData(e.currentTarget);
      if (!isLogin) {
        const pw = String(form.get("password") ?? "");
        if (pw.length < 8) {
          e.preventDefault();
          const errText = tr("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
          setMsg(errText);
          toast.warning(errText);
          return;
        }
        if (pw !== form.get("confirmPassword")) {
          e.preventDefault();
          const errText = tr("كلمتا المرور غير متطابقتين.");
          setMsg(errText);
          toast.warning(errText);
          return;
        }
      }
    }}>
      {(reason === "checkout" || next === "checkout") && (
        <div className={s.authNotice} role="status">
          <ShoppingBag size={18} aria-hidden="true" />
          <span>{tr("يمكنك إتمام الطلب كضيف بدون تسجيل دخول، أو تسجيل الدخول لاستخدام بيانات حسابك.")}</span>
        </div>
      )}

      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}
      {reason && <input type="hidden" name="reason" value={reason} />}
      {!isLogin && <input className={s.input} name="name" placeholder={tr("الاسم الكامل")} required autoComplete="name" />}
      <input className={`${s.input} ${s.emailInput}`} name="email" type={isAdminLogin ? "text" : "email"} placeholder={tr(isAdminLogin ? "اسم المستخدم أو البريد الإلكتروني" : "البريد الإلكتروني")} required autoComplete={isAdminLogin ? "username" : "email"} dir={isAdminLogin ? "auto" : "ltr"} />
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
      <PasswordInput className={s.input} name="password" placeholder={tr("كلمة المرور")} required minLength={isLogin ? undefined : 8} maxLength={128} autoComplete={isLogin ? "current-password" : "new-password"} showLabel={tr("إظهار كلمة المرور")} hideLabel={tr("إخفاء كلمة المرور")} />
      {!isLogin && <PasswordInput className={s.input} name="confirmPassword" placeholder={tr("تأكيد كلمة المرور")} required minLength={8} maxLength={128} autoComplete="new-password" showLabel={tr("إظهار كلمة المرور")} hideLabel={tr("إخفاء كلمة المرور")} />}
      {(msg || errorMessage) && <p role="alert" className={s.error}>{msg || errorMessage}</p>}
      <AuthSubmitButton isLogin={isLogin} locale={locale} />
      <p className={s.muted}>
        {tr(isLogin ? "ليس لديك حساب؟ " : "لديك حساب؟ ")}
        <Link className={s.link} href={toggleHref}>{tr(isLogin ? "إنشاء حساب جديد" : "تسجيل الدخول")}</Link>
      </p>
    </form>
  );
}
