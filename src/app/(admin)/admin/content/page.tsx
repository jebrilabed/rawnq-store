import { saveContentAction } from "../actions";
import s from "@/components/admin/admin.module.css";
import { db } from "@/lib/data/db";

export default function ContentAdmin({ searchParams }: { searchParams: { saved?: string } }) {
  const { about, delivery, faq } = db.content;
  const rows = [...faq, ["", ""] as [string, string]]; // صف فارغ لإضافة سؤال جديد
  return (
    <>
      <div className={s.bar}><h1>المحتوى</h1></div>
      {searchParams.saved && <p className={s.saved}>تم الحفظ</p>}
      <form action={saveContentAction} className={s.form}>
        <label className={s.label}>من نحن<textarea className={s.field} name="about" rows={4} defaultValue={about} maxLength={3000} /></label>
        <label className={s.label}>التوصيل والاسترجاع<textarea className={s.field} name="delivery" rows={4} defaultValue={delivery} maxLength={3000} /></label>
        <h2 style={{ fontSize: "1rem" }}>الأسئلة الشائعة</h2>
        <p className={s.muted}>امسح السؤال لحذفه. الصف الأخير الفارغ لإضافة سؤال جديد.</p>
        {rows.map(([q, a], i) => (
          <div key={i} className={s.faq}>
            <input className={s.field} name="q" defaultValue={q} placeholder="السؤال" maxLength={200} aria-label="السؤال" />
            <textarea className={s.field} name="a" rows={2} defaultValue={a} placeholder="الجواب" maxLength={1000} aria-label="الجواب" />
          </div>
        ))}
        <button className={s.btn}>حفظ المحتوى</button>
      </form>
    </>
  );
}
