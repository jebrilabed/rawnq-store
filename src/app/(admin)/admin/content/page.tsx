import { saveStoreContentAction } from "../actions";
import { SubmitButton } from "@/components/admin/Controls";
import { getStoredContent } from "@/lib/data/db";
import s from "@/components/admin/admin.module.css";

const LANGUAGES = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "he", label: "עברית" },
  { code: "ru", label: "Русский" },
] as const;

export default async function ContentAdmin({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const content = await getStoredContent();
  return (
    <>
      <header className={s.pageHeader}><div><span className={s.eyebrow}>إدارة اللغات</span><h1>محتوى المتجر</h1><p>أدخل نصوص الصفحات والأسئلة الشائعة بالعربية والإنجليزية والعبرية والروسية.</p></div></header>
      {searchParams.saved && <p role="status" className={s.saved}>تم حفظ محتوى المتجر.</p>}
      {searchParams.error && <p role="alert" className={s.error}>{searchParams.error}</p>}
      <form action={saveStoreContentAction} className={s.form}>
        <input type="hidden" name="faqCount" value={content.faq.length} />
        {LANGUAGES.map((language) => {
          const localized = language.code === "ar" ? content : content.translations[language.code] ?? { about: "", delivery: "", faq: [] };
          const faq = language.code === "ar" ? content.faq : localized.faq;
          return (
            <details key={language.code} className={s.localizedFields} open={language.code === "ar"}>
              <summary>{language.label}</summary>
              <label className={s.label}>من نحن
                <textarea className={s.field} name={`${language.code}_about`} rows={4} maxLength={5000} defaultValue={language.code === "ar" ? content.about : localized.about} />
              </label>
              <label className={s.label}>التوصيل والاسترجاع
                <textarea className={s.field} name={`${language.code}_delivery`} rows={4} maxLength={5000} defaultValue={language.code === "ar" ? content.delivery : localized.delivery} />
              </label>
              <h2>الأسئلة الشائعة ({language.label})</h2>
              {content.faq.map((_, index) => (
                <div className={s.form} key={index}>
                  <label className={s.label}>السؤال {index + 1}
                    <input className={s.field} name={`${language.code}_faq_q_${index}`} maxLength={300} defaultValue={faq[index]?.[0] ?? ""} />
                  </label>
                  <label className={s.label}>الإجابة {index + 1}
                    <textarea className={s.field} name={`${language.code}_faq_a_${index}`} rows={2} maxLength={2000} defaultValue={faq[index]?.[1] ?? ""} />
                  </label>
                </div>
              ))}
            </details>
          );
        })}
        <SubmitButton className={s.btn} pendingLabel="جارٍ الحفظ…">حفظ المحتوى</SubmitButton>
      </form>
    </>
  );
}
