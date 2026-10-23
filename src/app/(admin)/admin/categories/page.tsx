import { addCategoryAction } from "../actions";
import { SubmitButton } from "@/components/admin/Controls";
import { Plus } from "lucide-react";
import s from "@/components/admin/admin.module.css";
import { getCategoryRows } from "@/lib/data/admin";
import { CategoryPicker } from "@/components/admin/CategoryPicker";
import { CategoriesTable } from "@/components/admin/CategoriesTable";

export default async function CategoriesAdmin({ searchParams }: { searchParams: { error?: string } }) {
  const categories = await getCategoryRows();
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
        <CategoriesTable categories={categories} />
      )}
    </>
  );
}
