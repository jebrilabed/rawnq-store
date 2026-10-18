"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./admin.module.css";

const TABS = [
  ["/admin", "الرئيسية"], ["/admin/products", "المنتجات"], ["/admin/categories", "الأقسام"],
  ["/admin/orders", "الطلبات"], ["/admin/inventory", "المخزون"], ["/admin/content", "المحتوى"], ["/admin/settings", "الإعدادات"],
] as const;

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className={s.tabs} aria-label="لوحة التحكم">
      {TABS.map(([href, label]) => {
        const on = href === "/admin" ? path === href : path.startsWith(href);
        return <Link key={href} href={href} className={`${s.tab} ${on ? s.tabOn : ""}`}>{label}</Link>;
      })}
    </nav>
  );
}
