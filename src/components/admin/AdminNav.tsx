"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, LayoutDashboard, Package, Settings, ShoppingBag, Tags } from "lucide-react";
import s from "./admin.module.css";

const TABS = [
  ["/admin", "الرئيسية", LayoutDashboard], ["/admin/products", "المنتجات", Package], ["/admin/categories", "الأقسام", Tags],
  ["/admin/orders", "الطلبات", ShoppingBag], ["/admin/inventory", "المخزون", Boxes], ["/admin/settings", "الإعدادات", Settings],
] as const;

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className={s.tabs} aria-label="لوحة التحكم">
      {TABS.map(([href, label, Icon]) => {
        const on = href === "/admin" ? path === href : path.startsWith(href);
        return <Link key={href} href={href} className={`${s.tab} ${on ? s.tabOn : ""}`} aria-current={on ? "page" : undefined}>
          <Icon className={s.navIcon} size={18} aria-hidden="true" />{label}
        </Link>;
      })}
    </nav>
  );
}
