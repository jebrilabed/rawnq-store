"use client";
import Link from "next/link";
import { useState } from "react";
import s from "./storefront.module.css";

/**
 * واجهة فقط. اربط onSubmit بـ Server Action تستدعي signIn("credentials", …) من Auth.js
 * (للتسجيل: أنشئ المستخدم بدور CUSTOMER على الخادم فقط ثم سجّل دخوله).
 */
export function AuthForm({ mode, locale }: { mode: "login" | "register"; locale: string }) {
  const [msg, setMsg] = useState("");
  const isLogin = mode === "login";
  return (
    <form className={s.form} onSubmit={(e) => { e.preventDefault(); setMsg("غير مربوط بالباك بعد: اربطه مع Auth.js."); }}>
      {!isLogin && <input className={s.input} name="name" placeholder="الاسم الكامل" required autoComplete="name" />}
      <input className={s.input} name="phone" type="tel" placeholder="رقم الهاتف" required autoComplete="tel" />
      {!isLogin && <input className={s.input} name="city" placeholder="المدينة" required />}
      <input className={s.input} name="password" type="password" placeholder="كلمة المرور" required minLength={8} autoComplete={isLogin ? "current-password" : "new-password"} />
      {msg && <p role="status" className={s.muted}>{msg}</p>}
      <button className={s.btn}>{isLogin ? "دخول" : "إنشاء الحساب"}</button>
      <p className={s.muted}>
        {isLogin ? "ليس لديك حساب؟ " : "لديك حساب؟ "}
        <Link className={s.link} href={`/${locale}/${isLogin ? "register" : "login"}`}>{isLogin ? "إنشاء حساب جديد" : "تسجيل الدخول"}</Link>
      </p>
    </form>
  );
}
