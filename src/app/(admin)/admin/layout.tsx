import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Store } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { SubmitButton } from "@/components/admin/Controls";
import s from "@/components/admin/admin.module.css";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSettings } from "@/lib/data/db";
import { adminLogoutAction } from "./actions";

export const metadata: Metadata = { title: "RAWNQ | لوحة التحكم", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const { storeName } = await getSettings();
  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <div className={s.brand}>
          <Image src="/brand/logo.png" alt="" width={40} height={40} />
          <span className={s.brandText}><strong>{storeName}</strong><small>لوحة إدارة المتجر</small></span>
        </div>
        <div>
          <span className={s.navCaption}>إدارة المتجر</span>
          <AdminNav />
        </div>
        <div className={s.sidebarFoot}>RAWNQ · مساحة الإدارة</div>
      </aside>
      <div className={s.workspace}>
        <header className={s.top}>
          <div className={s.topIdentity}><small>{storeName} / الإدارة</small><strong>مساحة العمل</strong></div>
          <div className={s.pageActions}>
            <Link href="/ar" className={s.btnGhost}><Store size={16} aria-hidden="true" /> فتح المتجر</Link>
            <form action={adminLogoutAction}>
              <SubmitButton className={s.logout} pendingLabel="جارٍ تسجيل الخروج…"><LogOut size={16} aria-hidden="true" /> تسجيل الخروج</SubmitButton>
            </form>
          </div>
        </header>
        <main className={s.main}>{children}</main>
      </div>
    </div>
  );
}
