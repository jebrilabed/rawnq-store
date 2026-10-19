"use client";
import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { customerLoginAction, customerRegisterAction } from "@/app/[locale]/(store)/auth-actions";
import { Spinner } from "@/components/ui/LoadingState";
import s from "./storefront.module.css";

function AuthSubmitButton({ isLogin }: { isLogin: boolean }) {
  const { pending } = useFormStatus();
  return <button className={s.btn} disabled={pending} aria-busy={pending}>
    {pending ? <span className={s.pendingAction}><Spinner /> جارٍ المعالجة…</span> : isLogin ? "دخول" : "إنشاء الحساب"}
  </button>;
}

export function AuthForm({ mode, locale, error, next }: { mode: "login" | "register"; locale: string; error?: string; next?: string }) {
  const [msg, setMsg] = useState("");
  const isLogin = mode === "login";
  const errorMessage = error === "credentials"
    ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
    : error === "exists"
      ? "يوجد حساب مسجل بهذا البريد الإلكتروني."
      : error === "invalid"
        ? "تحقق من البيانات المدخلة، وتأكد أن كلمة المرور بين 8 و128 حرفاً."
        : "";
  return (
    <form className={`${s.form} ${s.authForm}`} action={isLogin ? customerLoginAction : customerRegisterAction} onSubmit={(e) => {
      const form = new FormData(e.currentTarget);
      if (!isLogin && form.get("password") !== form.get("confirmPassword")) {
        e.preventDefault();
        setMsg("كلمتا المرور غير متطابقتين.");
      }
    }}>
      <input type="hidden" name="locale" value={locale} />
      {isLogin && (next === "orders" || next === "admin") && <input type="hidden" name="next" value={next} />}
      {!isLogin && <input className={s.input} name="name" placeholder="الاسم الكامل" required autoComplete="name" />}
      <input className={s.input} name="email" type="email" placeholder="البريد الإلكتروني" required autoComplete="email" dir="ltr" />
      {!isLogin && <input className={`${s.input} ${s.phoneInput}`} name="phone" type="tel" placeholder="رقم الهاتف" required autoComplete="tel" />}
      {!isLogin && <input className={s.input} name="city" placeholder="المدينة" required />}
      {!isLogin && <textarea className={`${s.input} ${s.authAddress}`} name="address" placeholder="العنوان بالتفصيل" required minLength={4} autoComplete="street-address" />}
      <input className={s.input} name="password" type="password" placeholder="كلمة المرور" required minLength={isLogin ? undefined : 8} maxLength={128} autoComplete={isLogin ? "current-password" : "new-password"} />
      {!isLogin && <input className={s.input} name="confirmPassword" type="password" placeholder="تأكيد كلمة المرور" required minLength={8} maxLength={128} autoComplete="new-password" />}
      {(msg || errorMessage) && <p role="alert" className={s.error}>{msg || errorMessage}</p>}
      <AuthSubmitButton isLogin={isLogin} />
      <p className={s.muted}>
        {isLogin ? "ليس لديك حساب؟ " : "لديك حساب؟ "}
        <Link className={s.link} href={`/${locale}/${isLogin ? "register" : "login"}`}>{isLogin ? "إنشاء حساب جديد" : "تسجيل الدخول"}</Link>
      </p>
    </form>
  );
}
