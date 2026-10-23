import { addCategoryAction, deleteCategoryAction, renameCategoryAction } from "../actions";
import { ConfirmButton, SubmitButton } from "@/components/admin/Controls";
import { Plus, Tags } from "lucide-react";
import s from "@/components/admin/admin.module.css";
import { getCategoryRows } from "@/lib/data/admin";
import { orderCategories } from "@/lib/categories";
import { CategoryPicker } from "@/components/admin/CategoryPicker";

export default async function CategoriesAdmin({ searchParams }: { searchParams: { error?: string } }) {
  const categories = await getCategoryRows();
  const translationsOf = (value: string) => {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, string> : {};
    } catch (cause) {
      console.error("Invalid category translation data.", cause);
      return {};
    }
  };
  const orderedCategories = orderCategories(categories);
  const mainCategoryCount = categories.filter((category) => !category.parentSlug).length;
  return (
    <>
      <header className={s.pageHeader}><div><span className={s.eyebrow}>تنظيم الكتالوج</span><h1>الأقسام</h1><p>أنشئ أقسامًا رئيسية وأضف أقسامًا فرعية لتنظيم المنتجات.</p></div><span className={s.pill}>{mainCategoryCount} رئيسي · {categories.length - mainCategoryCount} فرعي</span></header>
      {searchParams.error && <p role="alert" className={s.error}>{searchParams.error}</p>}
      <form action={addCategoryAction} className={s.categoryAdd}>
        <input className={s.field} name="name" placeholder="اسم القسم الجديد" required maxLength={60} />
        <CategoryPicker
          categories={categories}
          name="parentSlug"
          placeholder="اختر القسم الأب"
          rootLabel="قسم رئيسي بدون أب"
        />
        <SubmitButton className={s.btn} pendingLabel="جارٍ الإضافة…"><Plus size={16} /> إضافة قسم</SubmitButton>
        <details className={s.localizedFields}><summary>أسماء القسم بالإنجليزية والعبرية والروسية (اختياري)</summary>
          <input className={s.field} name="name_en" placeholder="English name" maxLength={60} />
          <input className={s.field} name="name_he" placeholder="שם בעברית" maxLength={60} />
          <input className={s.field} name="name_ru" placeholder="Название на русском" maxLength={60} />
        </details>
      </form>
      {categories.length === 0 ? <div className={s.emptyState}>لا توجد أقسام بعد. أضف أول قسم.</div> : (
        <div className={s.tableWrap}><table className={s.table}>
          <thead><tr><th>القسم الرئيسي / الفرعي</th><th>المنتجات والأقسام الفرعية</th><th>الإجراءات</th></tr></thead>
          <tbody>{orderedCategories.map(({ category: c, depth }) => (
            <tr key={c.slug}>
              <td><div className={s.itemCell} style={{ paddingInlineStart: `${depth * 18}px` }}><Tags size={17} className={s.muted} /><div><b>{c.name}</b>{c.parent && <small>فرعي من: {c.parent.name}</small>}</div></div></td>
              <td><span className={s.categoryCount}>{c._count.products} منتج</span>{c._count.children > 0 && <span className={s.categoryCount}>{c._count.children} فرعي</span>}</td>
              <td><div className={s.cellActions}>
                <form action={renameCategoryAction} className={s.inline}>
                  <input type="hidden" name="slug" value={c.slug} />
                  <input className={s.field} name="name" defaultValue={c.name} required maxLength={60} aria-label="اسم القسم" />
                  <SubmitButton className={s.sm}>حفظ الاسم</SubmitButton>
                  <details className={s.localizedFields}><summary>ترجمات</summary>
                    <input className={s.field} name="name_en" defaultValue={translationsOf(c.translations).en} placeholder="English name" maxLength={60} />
                    <input className={s.field} name="name_he" defaultValue={translationsOf(c.translations).he} placeholder="שם בעברית" maxLength={60} />
                    <input className={s.field} name="name_ru" defaultValue={translationsOf(c.translations).ru} placeholder="Название на русском" maxLength={60} />
                  </details>
                </form>
                <form action={deleteCategoryAction}><input type="hidden" name="slug" value={c.slug} /><ConfirmButton className={`${s.sm} ${s.danger}`} message="حذف القسم؟">حذف</ConfirmButton></form>
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
