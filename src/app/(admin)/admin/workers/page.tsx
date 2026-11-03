import { requireAdmin } from "@/lib/auth/require-admin";
import { getWorkerAccounts, getWorkerActivity } from "@/lib/data/admin";
import Link from "next/link";
import { createWorkerAction } from "../actions";
import { SubmitButton } from "@/components/admin/Controls";
import s from "@/components/admin/admin.module.css";

export default async function WorkersAdmin({ searchParams }: { searchParams: { error?: string; created?: string; activityPage?: string } }) {
  await requireAdmin();
  const rawPage = Number(searchParams.activityPage);
  const requestedPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const [workers, activity] = await Promise.all([getWorkerAccounts(), getWorkerActivity(requestedPage)]);

  return (
    <>
      <header className={s.pageHeader}>
        <div><span className={s.eyebrow}>إدارة الصلاحيات</span><h1>العمال</h1><p>أنشئ حسابات دخول للعمال وراجع سجل تعديلاتهم.</p></div>
      </header>
      {searchParams.error && <p role="alert" className={s.error}>{searchParams.error}</p>}
      {searchParams.created && <p className={s.saved}>تم إنشاء حساب العامل بنجاح.</p>}

      <section className={s.settingsSection}>
        <h2>إنشاء حساب عامل</h2>
        <p>اسم العامل هو اسم الدخول الذي سيستخدمه مع كلمة المرور.</p>
        <form action={createWorkerAction} className={`${s.form} ${s.settingsForm}`}>
          <div className={s.settingsGrid}>
            <label className={`${s.label} ${s.settingsWide}`}>اسم العامل واسم الدخول<input className={s.field} name="name" required minLength={2} maxLength={80} autoComplete="username" /></label>
            <label className={s.label}>كلمة المرور<input className={s.field} name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" /></label>
            <label className={s.label}>تأكيد كلمة المرور<input className={s.field} name="confirmPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" /></label>
          </div>
          <div className={s.settingsActions}>
            <SubmitButton className={s.btn} pendingLabel="جارٍ إنشاء الحساب…">إنشاء حساب عامل</SubmitButton>
          </div>
        </form>
      </section>

      <section className={s.settingsSection}>
        <h2>حسابات العمال</h2>
        {workers.length === 0 ? <div className={s.emptyState}>لم تتم إضافة عمال بعد.</div> : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead><tr><th>اسم العامل</th><th>اسم الدخول</th><th>تاريخ الإنشاء</th></tr></thead>
              <tbody>{workers.map((worker) => (
                <tr key={worker.id}>
                  <td>{worker.name ?? worker.username ?? worker.email ?? "—"}</td>
                  <td dir="auto">{worker.username ?? worker.email ?? "—"}</td>
                  <td>{worker.createdAt.toLocaleDateString("ar")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className={s.settingsSection}>
        <h2>سجل تعديلات العمال</h2>
        <p>{activity.total} تعديل مسجل، مرتبة من الأحدث.</p>
        {activity.items.length === 0 ? <div className={s.emptyState}>ستظهر التعديلات هنا بعد أن يبدأ العمال باستخدام لوحة التحكم.</div> : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead><tr><th>العامل</th><th>التعديل</th><th>العنصر</th><th>التفاصيل</th><th>الوقت</th></tr></thead>
              <tbody>{activity.items.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.actorName}</td>
                  <td>{entry.action}</td>
                  <td>{entry.entityType}: {entry.entityName}</td>
                  <td>{entry.details || "—"}</td>
                  <td>{entry.createdAt.toLocaleString("ar")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {activity.pageCount > 1 && (
          <div className={s.settingsActions}>
            <div className={s.pageActions}>
              {activity.page > 1 && <Link className={s.btnGhost} href={`/admin/workers?activityPage=${activity.page - 1}`} prefetch={false}>السجل الأحدث</Link>}
              <span className={s.muted}>صفحة {activity.page} من {activity.pageCount}</span>
              {activity.page < activity.pageCount && <Link className={s.btnGhost} href={`/admin/workers?activityPage=${activity.page + 1}`} prefetch={false}>السجل الأقدم</Link>}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
