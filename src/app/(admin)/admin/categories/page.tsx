import { addCategoryAction, deleteCategoryAction, renameCategoryAction } from "../actions";
import { ConfirmButton } from "@/components/admin/Controls";
import s from "@/components/admin/admin.module.css";
import { db } from "@/lib/data/db";

export default function CategoriesAdmin({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <>
      <div className={s.bar}><h1>الأقسام</h1></div>
      {searchParams.error && <p role="alert" className={s.error}>{searchParams.error}</p>}
      <form action={addCategoryAction} className={s.inline} style={{ marginBottom: 16 }}>
        <input className={s.field} name="name" placeholder="اسم القسم الجديد" required maxLength={60} />
        <button className={s.btn}>+ إضافة</button>
      </form>
      {db.categories.length === 0 && <p className={s.muted}>لا توجد أقسام بعد. أضف أول قسم.</p>}
      {db.categories.map((c) => {
        const n = db.products.filter((p) => p.categorySlug === c.slug).length;
        return (
          <div key={c.slug} className={s.row}>
            <form action={renameCategoryAction} className={`${s.grow} ${s.inline}`}>
              <input type="hidden" name="slug" value={c.slug} />
              <input className={s.field} name="name" defaultValue={c.name} required maxLength={60} aria-label="اسم القسم" />
              <button className={s.sm}>حفظ الاسم</button>
            </form>
            <span className={s.pill}>{n} منتج</span>
            <form action={deleteCategoryAction}><input type="hidden" name="slug" value={c.slug} /><ConfirmButton className={`${s.sm} ${s.danger}`} message="حذف القسم؟">حذف</ConfirmButton></form>
          </div>
        );
      })}
    </>
  );
}
