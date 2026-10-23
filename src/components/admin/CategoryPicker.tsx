"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Category } from "@/lib/types";
import { orderCategories } from "@/lib/categories";
import s from "./admin.module.css";

export function CategoryPicker({
  categories,
  name,
  value,
  placeholder,
  rootLabel,
}: {
  categories: Category[];
  name: string;
  value?: string;
  placeholder: string;
  rootLabel?: string;
}) {
  const [selectedSlug, setSelectedSlug] = useState(value ?? "");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const orderedCategories = orderCategories(categories);
  const selectedCategory = categories.find((category) => category.slug === selectedSlug);
  const selectedParentSlug = selectedCategory?.parentSlug;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function toggleExpanded(slug: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function selectCategory(slug: string) {
    setSelectedSlug(slug);
    setOpen(false);
  }

  function renderBranch(parentSlug: string | null, depth: number): React.ReactNode {
    return orderedCategories
      .filter(({ category }) => (category.parentSlug ?? null) === parentSlug)
      .map(({ category }) => {
        const children = orderedCategories.some((item) => item.category.parentSlug === category.slug);
        const isExpanded = expanded.has(category.slug);
        return (
          <div className={s.categoryPickerNode} key={category.slug}>
            <div className={s.categoryPickerRow} style={{ paddingInlineStart: `${10 + depth * 18}px` }}>
              <button
                type="button"
                className={`${s.categoryPickerOption} ${selectedSlug === category.slug ? s.categoryPickerSelected : ""} ${selectedParentSlug === category.slug ? s.categoryPickerDirectParent : ""} ${children ? s.categoryPickerParentOption : ""}`}
                aria-expanded={children ? isExpanded : undefined}
                onClick={() => children ? toggleExpanded(category.slug) : selectCategory(category.slug)}
              >
                <span>{category.name}</span>
                {children && <ChevronDown size={17} className={isExpanded ? s.categoryPickerChevronOpen : ""} />}
              </button>
            </div>
            {children && isExpanded && (
              <div className={s.categoryPickerChildren}>
                <button
                  type="button"
                  className={`${s.categoryPickerOption} ${s.categoryPickerSelfOption} ${selectedSlug === category.slug ? s.categoryPickerSelected : ""} ${selectedParentSlug === category.slug ? s.categoryPickerDirectParent : ""}`}
                  onClick={() => selectCategory(category.slug)}
                >
                  اختيار القسم: {category.name}
                </button>
                {renderBranch(category.slug, depth + 1)}
              </div>
            )}
          </div>
        );
      });
  }

  return (
    <div className={s.categoryPicker} ref={rootRef}>
      <input type="hidden" name={name} value={selectedSlug} />
      <button
        type="button"
        className={`${s.field} ${s.categoryPickerTrigger}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedCategory?.name ?? rootLabel ?? placeholder}</span>
        <ChevronDown size={17} className={open ? s.categoryPickerChevronOpen : ""} />
      </button>
      {open && (
        <div className={s.categoryPickerMenu}>
          {rootLabel && (
            <button
              type="button"
              className={`${s.categoryPickerOption} ${!selectedSlug ? s.categoryPickerSelected : ""}`}
              onClick={() => selectCategory("")}
            >
              {rootLabel}
            </button>
          )}
          {renderBranch(null, 0)}
        </div>
      )}
    </div>
  );
}
