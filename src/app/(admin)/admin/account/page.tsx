import { requireStaffOrAdmin } from "@/lib/auth/require-admin";
import { changePasswordAction } from "../actions";
import { SubmitButton } from "@/components/admin/Controls";
import s from "@/components/admin/admin.module.css";

export default async function AccountPage({ searchParams }: { searchParams: { passwordError?: string; passwordChanged?: string } }) {
  const session = await requireStaffOrAdmin();
  const roleLabel = session.user.role === "WORKER" ? "عامل" : "مسؤول";
  return (
    <>
      <header className={s.pageHeader}>
        <div>
          <span className={s.eyebrow}>الحساب الشخصي</span>
          <h1>إعدادات الحساب</h1>
          <p>تغيير كلمة المرور الخاصة بك.</p>
        </div>
        <span className={s.pill}>{session.user.email} · {roleLabel}</span>
      </header>

      {searchParams.passwordError && <p role="alert" className={s.error}>{searchParams.passwordError}</p>}
      {searchParams.passwordChanged && <p className={s.saved}>تم تغيير كلمة المرور بنجاح.</p>}

      <section className={s.settingsSection}>
        <h2>تغيير كلمة المرور</h2>
        <p>أدخل كلمة المرور الحالية، ثم اختر كلمة مرور جديدة لا تقل عن 8 أحرف.</p>
        <form action={changePasswordAction} className={`${s.form} ${s.settingsForm}`}>
          <div className={s.settingsGrid}>
            <label className={`${s.label} ${s.settingsWide}`}>كلمة المرور الحالية<input className={s.field} name="currentPassword" type="password" required maxLength={128} autoComplete="current-password" /></label>
            <label className={s.label}>كلمة المرور الجديدة<input className={s.field} name="newPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" /></label>
            <label className={s.label}>تأكيد كلمة المرور الجديدة<input className={s.field} name="confirmPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" /></label>
          </div>
          <div className={s.settingsActions}>
            <SubmitButton className={s.btn} pendingLabel="جارٍ الحفظ…">حفظ كلمة المرور</SubmitButton>
          </div>
        </form>
      </section>
    </>
  );
}