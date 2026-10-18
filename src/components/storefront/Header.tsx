"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, ShoppingCart, User, X } from "lucide-react";
import { useCart } from "./CartProvider";
import s from "./storefront.module.css";

export function Header({ locale }: { locale: string }) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const base = `/${locale}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: base, label: "الرئيسية" },
    { href: `${base}/products`, label: "المنتجات" },
    { href: `${base}/orders`, label: "طلباتي" },
  ];

  return (
    <>
      <header className={s.header} style={scrolled ? { boxShadow: "0 6px 24px #1c243014" } : undefined}>
        <div className={`${s.wrap} ${s.bar}`}>
          <button className={s.menuBtn} onClick={() => setOpen(true)} aria-label="القائمة"><Menu size={22} /></button>
          <Link href={base} className={s.logo}>
            <Image src="/brand/logo.png" alt="شعار رونق" width={44} height={44} priority />
            RAWNQ
          </Link>
          <nav className={s.nav} aria-label="التنقل الرئيسي">
            {links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          </nav>
          <Link href={`${base}/login`} className={s.iconBtn} aria-label="الحساب"><User size={22} /></Link>
          <Link href={`${base}/cart`} className={s.iconBtn} aria-label="سلة التسوق">
            <ShoppingCart size={22} />
            {count > 0 && <span className={s.badge}>{count}</span>}
          </Link>
        </div>
      </header>
      {open && (
        <>
          <div className={s.scrim} onClick={() => setOpen(false)} />
          <aside className={s.drawer} aria-label="القائمة">
            <button className={s.iconBtn} style={{ alignSelf: "flex-end" }} onClick={() => setOpen(false)} aria-label="إغلاق"><X size={22} /></button>
            {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>)}
            <Link href={`${base}/login`} onClick={() => setOpen(false)}>تسجيل الدخول</Link>
          </aside>
        </>
      )}
    </>
  );
}
