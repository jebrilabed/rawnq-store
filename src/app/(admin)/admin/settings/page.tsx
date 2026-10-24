import { saveSettingsAction } from "../actions";
import { SubmitButton } from "@/components/admin/Controls";
import { DeliveryAreasEditor } from "@/components/admin/DeliveryAreasEditor";
import s from "@/components/admin/admin.module.css";
import { getSettings } from "@/lib/data/db";
import { BestRouteConnectionCheck } from "@/components/admin/BestRouteConnectionCheck";

export default async function SettingsAdmin({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  const st = await getSettings();
  return (
    <>
      <header className={s.pageHeader}><div><span className={s.eyebrow}>التشغيل</span><h1>إعدادات المتجر</h1><p>بيانات المتجر والشحن وطرق الدفع وحدود المخزون.</p></div></header>
      <BestRouteConnectionCheck />
      {searchParams.error && <p role="alert" className={s.error}>{searchParams.error}</p>}
      {searchParams.saved && <p className={s.saved}>تم الحفظ</p>}
      <form action={saveSettingsAction} className={`${s.form} ${s.settingsForm}`}>
        <section className={s.settingsSection}>
          <h2>الهوية والتواصل</h2><p>المعلومات التي تظهر للمتسوقين في المتجر.</p>
          <div className={s.settingsGrid}>
            <label className={`${s.label} ${s.settingsWide}`}>اسم المتجر<input className={s.field} name="storeName" defaultValue={st.storeName} required /></label>
            <label className={`${s.label} ${s.settingsWide}`}>رقم الجوال وواتساب<input className={s.field} name="phone" type="tel" defaultValue={st.phone || st.whatsapp} dir="ltr" autoComplete="tel" /></label>
            <label className={`${s.label} ${s.settingsWide}`}>حساب إنستغرام<input className={s.field} name="instagram" defaultValue={st.instagram} dir="ltr" /></label>
          </div>
        </section>
        <section className={s.settingsSection}>
          <h2>مناطق التوصيل والمخزون</h2><p>أضف مناطق التوصيل وحدد رسوم كل منطقة على حدة.</p>
          <div className={s.settingsGrid}>
            <label className={s.label}>حد تنبيه المخزون المنخفض<input className={s.field} name="lowStockThreshold" type="number" min={0} defaultValue={st.lowStockThreshold} /></label>
          </div>
          <DeliveryAreasEditor initial={st.deliveryAreas} />
        </section>
        <section className={s.settingsSection}>
          <h2>طرق الدفع</h2><p>فعّل الوسائل المتاحة عند إتمام الطلب.</p>
          <div className={s.settingsGrid}>
            <label className={s.check}><input type="checkbox" name="cod" defaultChecked={st.cod} /> الدفع عند الاستلام</label>
            <label className={s.check}><input type="checkbox" name="bank" defaultChecked={st.bank} /> تحويل بنكي</label>
            <label className={s.label}>اسم صاحب الحساب<input className={s.field} name="bankAccountName" defaultValue={st.bankAccountName} maxLength={120} autoComplete="name" /></label>
            <label className={s.label}>رقم الحساب<input className={s.field} name="bankAccountNumber" defaultValue={st.bankAccountNumber} maxLength={34} dir="ltr" inputMode="numeric" /></label>
            <label className={`${s.label} ${s.settingsWide}`}>رقم الآيبان (IBAN)<input className={s.field} name="bankIban" defaultValue={st.bankIban} maxLength={34} dir="ltr" autoCapitalize="characters" /></label>
          </div>
        </section>
        <div className={s.settingsActions}>
          <SubmitButton className={s.btn} pendingLabel="جارٍ حفظ الإعدادات…">حفظ الإعدادات</SubmitButton>
        </div>

      </form>
    </>
  );
}
