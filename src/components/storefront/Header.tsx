"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, LayoutDashboard, Menu, ShoppingCart, User, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { useFavorites } from "./FavoritesProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { translate } from "@/lib/i18n";
import type { Category } from "@/lib/types";
import s from "./storefront.module.css";

export function Header({ locale, storeName, userRole, categories }: { locale: string; storeName: string; userRole?: string; categories: Category[] }) {
  const { count } = useCart();
  const favorites = useFavorites();
  const [open, setOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set());
  const [expandedDrawerCategories, setExpandedDrawerCategories] = useState<Set<string>>(() => new Set());
  const [scrolled, setScrolled] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const base = `/${locale}`;
  const tr = (text: string) => translate(locale, text);
  const mainCategories = categories.filter((category) => !category.parentSlug);
  const categoryHref = (slug: string) => `${base}/categories/${slug}`;
  const toggleCategory = (slug: string, drawer = false) => {
    const setExpanded = drawer ? setExpandedDrawerCategories : setExpandedCategories;
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };
  const accountHref = userRole === "ADMIN" ? "/admin" : userRole === "CUSTOMER" ? `${base}/profile` : `${base}/login`;
  const accountLabel = userRole === "ADMIN" ? tr("لوحة التحكم") : userRole === "CUSTOMER" ? tr("ملفي الشخصي") : tr("تسجيل الدخول");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!categoryMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !categoryMenuRef.current?.contains(event.target)) {
        setCategoryMenuOpen(false);
        setExpandedCategories(new Set());
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCategoryMenuOpen(false);
        setExpandedCategories(new Set());
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [categoryMenuOpen]);

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
            <div className={s.categoryMenu} ref={categoryMenuRef}>
              <button
                type="button"
                className={s.categoryMenuTrigger}
                aria-expanded={categoryMenuOpen}
                onClick={() => {
                  setCategoryMenuOpen((value) => !value);
                  setExpandedCategories(new Set());
                }}
              >
                {tr("الأقسام")} <ChevronDown size={15} />
              </button>
              {categoryMenuOpen && (
                <div className={s.categoryDropdown}>
                  <CategoryBranchList
                    categories={mainCategories}
                    allCategories={categories}
                    expandedCategories={expandedCategories}
                    toggleCategory={(slug) => toggleCategory(slug)}
                    onNavigate={() => setCategoryMenuOpen(false)}
                    categoryHref={categoryHref}
                    viewCategoryLabel={tr("عرض القسم")}
                  />
                </div>
              )}
            </div>
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
            <span className={s.drawerCategoryHeading}>{tr("الأقسام")}</span>
            <CategoryBranchList
              categories={mainCategories}
              allCategories={categories}
              expandedCategories={expandedDrawerCategories}
              toggleCategory={(slug) => toggleCategory(slug, true)}
              onNavigate={() => setOpen(false)}
              categoryHref={categoryHref}
              viewCategoryLabel={tr("عرض القسم")}
              mobile
            />
            <Link href={accountHref} onClick={() => setOpen(false)}>{accountLabel}</Link>
          </aside>
        </>
      )}
    </>
  );
}

function CategoryBranchList({
  categories,
  allCategories,
  expandedCategories,
  toggleCategory,
  onNavigate,
  categoryHref,
  viewCategoryLabel,
  mobile = false,
}: {
  categories: Category[];
  allCategories: Category[];
  expandedCategories: ReadonlySet<string>;
  toggleCategory: (slug: string) => void;
  onNavigate: () => void;
  categoryHref: (slug: string) => string;
  viewCategoryLabel: string;
  mobile?: boolean;
}) {
  const listClass = mobile ? s.drawerCategoryBranchList : s.categoryMainList;
  const submenuClass = mobile ? s.drawerCategorySubmenu : s.categorySubmenu;
  return (
    <div className={listClass}>
      {categories.map((category) => {
        const children = allCategories.filter((item) => item.parentSlug === category.slug);
        const expanded = expandedCategories.has(category.slug);
        if (!children.length) {
          return <Link key={category.slug} className={s.categoryMenuItem} href={categoryHref(category.slug)} onClick={onNavigate}>{category.name}</Link>;
        }
        return (
          <div key={category.slug} className={mobile ? s.drawerCategoryGroup : undefined}>
            <button
              type="button"
              className={`${s.categoryMenuItem} ${expanded ? s.categoryMenuItemActive : ""}`}
              aria-expanded={expanded}
              onClick={() => toggleCategory(category.slug)}
            >
              {category.name}<ChevronDown size={16} />
            </button>
            {expanded && (
              <div className={submenuClass}>
                <div className={mobile ? s.drawerCategorySubmenuContent : s.categorySubmenuContent}>
                  <Link href={categoryHref(category.slug)} onClick={onNavigate}>{viewCategoryLabel} · {category.name}</Link>
                  <CategoryBranchList
                    categories={children}
                    allCategories={allCategories}
                    expandedCategories={expandedCategories}
                    toggleCategory={toggleCategory}
                    onNavigate={onNavigate}
                    categoryHref={categoryHref}
                    viewCategoryLabel={viewCategoryLabel}
                    mobile={mobile}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
