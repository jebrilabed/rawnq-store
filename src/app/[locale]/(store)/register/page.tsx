import { AuthForm } from "@/components/storefront/AuthForm";
import s from "@/components/storefront/storefront.module.css";

export default function Page({ params }: { params: { locale: string } }) {
  return (
    <main className={`${s.wrap} ${s.section}`}>
      <div className={s.head}><h1>إنشاء حساب</h1></div>
      <AuthForm mode="register" locale={params.locale} />
    </main>
  );
}
