import { addCategoryAction, deleteCategoryAction, renameCategoryAction } from "../actions";
import { ConfirmButton, SubmitButton } from "@/components/admin/Controls";
import { Plus, Tags } from "lucide-react";
import s from "@/components/admin/admin.module.css";
import { getCategoryRows } from "@/lib/data/admin";

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
  return (
    <>
      <header className={s.pageHeader}><div><span className={s.eyebrow}>تنظيم الكتالوج</span><h1>الأقسام</h1><p>رتب المنتجات ضمن أقسام واضحة للمتسوقين.</p></div><span className={s.pill}>{categories.length} قسم</span></header>
      {searchParams.error && <p role="alert" className={s.error}>{searchParams.error}</p>}
      <form action={addCategoryAction} className={s.categoryAdd}>
        <input className={s.field} name="name" placeholder="اسم القسم الجديد" required maxLength={60} />
        <SubmitButton className={s.btn} pendingLabel="جارٍ الإضافة…"><Plus size={16} /> إضافة قسم</SubmitButton>
        <details className={s.localizedFields}><summary>أسماء القسم بالإنجليزية والعبرية والروسية (اختياري)</summary>
          <input className={s.field} name="name_en" placeholder="English name" maxLength={60} />
          <input className={s.field} name="name_he" placeholder="שם בעברית" maxLength={60} />
          <input className={s.field} name="name_ru" placeholder="Название на русском" maxLength={60} />
        </details>
      </form>
      {categories.length === 0 ? <div className={s.emptyState}>لا توجد أقسام بعد. أضف أول قسم.</div> : (
        <div className={s.tableWrap}><table className={s.table}>
          <thead><tr><th>القسم</th><th>المنتجات</th><th>الإجراءات</th></tr></thead>
          <tbody>{categories.map((c) => (
            <tr key={c.slug}>
              <td><div className={s.itemCell}><Tags size={17} className={s.muted} /><b>{c.name}</b></div></td>
              <td><span className={s.categoryCount}>{c._count.products} منتج</span></td>
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
