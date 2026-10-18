import type { Metadata } from "next";
import Image from "next/image";
import { AdminNav } from "@/components/admin/AdminNav";
import s from "@/components/admin/admin.module.css";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "RAWNQ | لوحة التحكم", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <div className={s.top}>
        <Image src="/brand/logo.png" alt="" width={40} height={40} />
        <b>RAWNQ</b><span className={s.tag}>لوحة التحكم</span>
      </div>
      <AdminNav />
      <main className={s.main}>{children}</main>
    </>
  );
}
