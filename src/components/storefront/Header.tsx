"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, LayoutDashboard, Menu, ShoppingCart, User, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { useFavorites } from "./FavoritesProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { translate } from "@/lib/i18n";
import s from "./storefront.module.css";

export function Header({ locale, storeName, userRole }: { locale: string; storeName: string; userRole?: string }) {
  const { count } = useCart();
  const favorites = useFavorites();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const base = `/${locale}`;
  const tr = (text: string) => translate(locale, text);
  const accountHref = userRole === "ADMIN" ? "/admin" : userRole === "CUSTOMER" ? `${base}/profile` : `${base}/login`;
  const accountLabel = userRole === "ADMIN" ? tr("لوحة التحكم") : userRole === "CUSTOMER" ? tr("ملفي الشخصي") : tr("تسجيل الدخول");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: base, label: tr("الرئيسية") },
    { href: `${base}/products`, label: tr("المنتجات") },
    ...(userRole === "CUSTOMER" ? [{ href: `${base}/orders`, label: tr("طلباتي") }] : []),
  ];

  return (
    <>
      <header className={s.header} style={scrolled ? { boxShadow: "0 6px 24px #1c243014" } : undefined}>
        <div className={`${s.wrap} ${s.bar}`}>
          <button className={s.menuBtn} onClick={() => setOpen(true)} aria-label={tr("القائمة")}><Menu size={22} /></button>
          <Link href={base} className={s.logo}>
            <Image src="/brand/logo.png" alt={`شعار ${storeName}`} width={44} height={44} priority />
            <span className={s.logoName}>{storeName}</span>
          </Link>
          <nav className={s.nav} aria-label={tr("التنقل الرئيسي")}>
            {links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          </nav>
          <LanguageSwitcher locale={locale} />
          <Link href={accountHref} className={`${s.iconBtn} ${!userRole ? s.loginBtn : ""}`} aria-label={accountLabel}>
            {userRole === "ADMIN" ? <LayoutDashboard size={22} /> : userRole === "CUSTOMER" ? <User size={22} /> : accountLabel}
          </Link>
          <Link href={`${base}/favorites`} className={s.iconBtn} aria-label={`${tr("المفضلة")}، ${favorites.count}`}>
            <Heart size={21} />
            {favorites.count > 0 && <span className={s.badge}>{favorites.count}</span>}
          </Link>
          <Link href={`${base}/cart`} className={s.iconBtn} aria-label={tr("سلة التسوق")}>
            <ShoppingCart size={22} />
            {count > 0 && <span className={s.badge}>{count}</span>}
          </Link>
        </div>
      </header>
      {open && (
        <>
          <div className={s.scrim} onClick={() => setOpen(false)} />
          <aside className={s.drawer} aria-label={tr("القائمة")}>
            <button className={s.iconBtn} style={{ alignSelf: "flex-end" }} onClick={() => setOpen(false)} aria-label={tr("إغلاق")}><X size={22} /></button>
            {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>)}
            <Link href={accountHref} onClick={() => setOpen(false)}>{accountLabel}</Link>
          </aside>
        </>
      )}
    </>
  );
}
