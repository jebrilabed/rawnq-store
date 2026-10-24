"use client";
import { useState } from "react";
import { ChevronDown, Tags } from "lucide-react";
import { deleteCategoryAction, moveCategoryAction, renameCategoryAction } from "@/app/(admin)/admin/actions";
import { ConfirmButton, SubmitButton } from "@/components/admin/Controls";
import { getCategoryDescendantSlugs, orderCategories } from "@/lib/categories";
import type { Category } from "@/lib/types";
import s from "./admin.module.css";

type CategoryRow = Category & {
  translations: string;
  parent: { name: string } | null;
  _count: { products: number; children: number };
};

export function CategoriesTable({ categories }: { categories: CategoryRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [translationOpen, setTranslationOpen] = useState<Set<string>>(() => new Set());
  const [parentOpen, setParentOpen] = useState<Set<string>>(() => new Set());
  const orderedCategories = orderCategories(categories);
  const visibleCategories = orderedCategories.filter(({ category }) => {
    let parentSlug = category.parentSlug;
    while (parentSlug) {
      if (!expanded.has(parentSlug)) return false;
      parentSlug = categories.find((item) => item.slug === parentSlug)?.parentSlug ?? null;
    }
    return true;
  });

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, slug: string) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead><tr><th>القسم الرئيسي / الفرعي</th><th>المنتجات والأقسام الفرعية</th><th>الإجراءات</th></tr></thead>
        <tbody>
          {visibleCategories.map(({ category, depth }) => {
            const hasChildren = category._count.children > 0;
            const isExpanded = expanded.has(category.slug);
            const isTranslationOpen = translationOpen.has(category.slug);
            const translations = translationsOf(category.translations);
            return (
              <CategoryRows
                key={category.slug}
                category={category}
                parentOptions={orderCategories(categories.filter(({ slug }) => !getCategoryDescendantSlugs(categories, category.slug).has(slug)))}
                depth={depth}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                isTranslationOpen={isTranslationOpen}
                isParentOpen={parentOpen.has(category.slug)}
                translations={translations}
                onToggleExpanded={() => toggle(setExpanded, category.slug)}
                onToggleTranslation={() => toggle(setTranslationOpen, category.slug)}
                onToggleParent={() => toggle(setParentOpen, category.slug)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CategoryRows({
  category,
  parentOptions,
  depth,
  hasChildren,
  isExpanded,
  isTranslationOpen,
  isParentOpen,
  translations,
  onToggleExpanded,
  onToggleTranslation,
  onToggleParent,
}: {
  category: CategoryRow;
  parentOptions: { category: CategoryRow; depth: number }[];
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isTranslationOpen: boolean;
  isParentOpen: boolean;
  translations: Record<string, string>;
  onToggleExpanded: () => void;
  onToggleTranslation: () => void;
  onToggleParent: () => void;
}) {
  return (
    <>
      <tr>
        <td>
          <div className={s.categoryTreeName} style={{ paddingInlineStart: `${depth * 18}px` }}>
            {hasChildren
              ? <button type="button" className={s.categoryTreeToggle} aria-label={`${isExpanded ? "إخفاء" : "عرض"} الأقسام الفرعية لـ ${category.name}`} aria-expanded={isExpanded} onClick={onToggleExpanded}><ChevronDown size={16} className={isExpanded ? s.categoryTreeChevronOpen : ""} /></button>
              : <span className={s.categoryTreeTogglePlaceholder} />}
            <Tags size={17} className={s.muted} />
            <div><b>{category.name}</b>{category.parent && <small>فرعي من: {category.parent.name}</small>}</div>
          </div>
        </td>
        <td>
          <span className={s.categoryCount}>{category._count.products} منتج</span>
          {hasChildren && <span className={s.categoryCount}>{category._count.children} فرعي</span>}
        </td>
        <td>
          <div className={s.cellActions}>
            <form action={renameCategoryAction} className={s.inline}>
              <input type="hidden" name="slug" value={category.slug} />
              <input className={s.field} name="name" defaultValue={category.name} required maxLength={60} aria-label="اسم القسم" />
              <input type="hidden" name="name_en" value={translations.en ?? ""} />
              <input type="hidden" name="name_he" value={translations.he ?? ""} />
              <input type="hidden" name="name_ru" value={translations.ru ?? ""} />
              <SubmitButton className={s.sm}>حفظ الاسم</SubmitButton>
            </form>
            <button type="button" className={s.sm} aria-expanded={isTranslationOpen} onClick={onToggleTranslation}>
              {isTranslationOpen ? "إخفاء الترجمات" : "ترجمات"}
            </button>
            <button type="button" className={s.sm} aria-expanded={isParentOpen} onClick={onToggleParent}>
              {isParentOpen ? "إلغاء النقل" : "تغيير القسم الأب"}
            </button>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="slug" value={category.slug} />
              <ConfirmButton className={`${s.sm} ${s.danger}`} message="حذف القسم؟">حذف</ConfirmButton>
            </form>
          </div>
        </td>
      </tr>
      {isParentOpen && (
        <tr className={s.categoryTranslationRow}>
          <td colSpan={3}>
            <form action={moveCategoryAction} className={s.categoryTranslationForm}>
              <input type="hidden" name="slug" value={category.slug} />
              <label>القسم الأب
                <select className={s.field} name="parentSlug" defaultValue={category.parentSlug ?? ""}>
                  <option value="">قسم رئيسي بدون أب</option>
                  {parentOptions.map(({ category: parent, depth: parentDepth }) => (
                    <option key={parent.slug} value={parent.slug}>
                      {"— ".repeat(parentDepth)}{parent.name}
                    </option>
                  ))}
                </select>
              </label>
              <SubmitButton className={s.sm}>حفظ القسم الأب</SubmitButton>
            </form>
          </td>
        </tr>
      )}
      {isTranslationOpen && (
        <tr className={s.categoryTranslationRow}>
          <td colSpan={3}>
            <form action={renameCategoryAction} className={s.categoryTranslationForm}>
              <input type="hidden" name="slug" value={category.slug} />
              <input type="hidden" name="name" value={category.name} />
              <label>الإنجليزية<input className={s.field} name="name_en" defaultValue={translations.en} placeholder="English name" maxLength={60} /></label>
              <label>العبرية<input className={s.field} name="name_he" defaultValue={translations.he} placeholder="שם בעברית" maxLength={60} /></label>
              <label>الروسية<input className={s.field} name="name_ru" defaultValue={translations.ru} placeholder="Название на русском" maxLength={60} /></label>
              <SubmitButton className={s.sm}>حفظ الترجمات</SubmitButton>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

function translationsOf(value: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, string> : {};
  } catch (cause) {
    console.error("Invalid category translation data.", cause);
    return {};
  }
}
