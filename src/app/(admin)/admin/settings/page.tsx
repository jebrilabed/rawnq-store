import { saveSettingsAction } from "../actions";
import s from "@/components/admin/admin.module.css";
import { db } from "@/lib/data/db";

export default function SettingsAdmin({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  const st = db.settings;
  return (
    <>
      <div className={s.bar}><h1>إعدادات المتجر</h1></div>
      {searchParams.error && <p role="alert" className={s.error}>{searchParams.error}</p>}
      {searchParams.saved && <p className={s.saved}>تم الحفظ</p>}
      <form action={saveSettingsAction} className={s.form}>
        <label className={s.label}>اسم المتجر<input className={s.field} name="storeName" defaultValue={st.storeName} required /></label>
        <div className={s.two}>
          <label className={s.label}>الهاتف<input className={s.field} name="phone" defaultValue={st.phone} dir="ltr" /></label>
          <label className={s.label}>واتساب<input className={s.field} name="whatsapp" defaultValue={st.whatsapp} dir="ltr" /></label>
        </div>
        <label className={s.label}>حساب إنستغرام<input className={s.field} name="instagram" defaultValue={st.instagram} dir="ltr" /></label>
        <div className={s.two}>
          <label className={s.label}>رسوم الشحن (₪)<input className={s.field} name="shippingFee" type="number" min={0} step="0.5" defaultValue={st.shippingFee} required /></label>
          <label className={s.label}>شحن مجاني فوق (₪)<input className={s.field} name="freeShippingFrom" type="number" min={0} defaultValue={st.freeShippingFrom ?? ""} placeholder="فارغ = معطّل" /></label>
        </div>
        <label className={s.label}>حد تنبيه المخزون المنخفض<input className={s.field} name="lowStockThreshold" type="number" min={0} defaultValue={st.lowStockThreshold} /></label>
        <b>طرق الدفع</b>
        <label className={s.check}><input type="checkbox" name="cod" defaultChecked={st.cod} /> الدفع عند الاستلام</label>
        <label className={s.check}><input type="checkbox" name="bank" defaultChecked={st.bank} /> تحويل بنكي</label>
        <label className={s.label}>بيانات الحساب البنكي (تظهر للزبون)<textarea className={s.field} name="bankDetails" rows={3} defaultValue={st.bankDetails} maxLength={500} /></label>
        <button className={s.btn}>حفظ الإعدادات</button>
      </form>
    </>
  );
}
