"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, FileText, LayoutDashboard, Package, Settings, ShoppingBag, Tags } from "lucide-react";
import s from "./admin.module.css";

const ADMIN_TABS = [
  ["/admin", "الرئيسية", LayoutDashboard], ["/admin/products", "المنتجات", Package], ["/admin/categories", "الأقسام", Tags],
  ["/admin/orders", "الطلبات", ShoppingBag], ["/admin/inventory", "المخزون", Boxes], ["/admin/settings", "الإعدادات", Settings],
  ["/admin/content", "محتوى المتجر", FileText],
] as const;

const WORKER_TABS = [
  ["/admin/products", "المنتجات", Package],
  ["/admin/inventory", "المخزون", Boxes],
] as const;

export function AdminNav({ role }: { role: string }) {
  const path = usePathname();
  const TABS = role === "WORKER" ? WORKER_TABS : ADMIN_TABS;
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