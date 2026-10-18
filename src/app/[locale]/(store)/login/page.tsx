import { AuthForm } from "@/components/storefront/AuthForm";
import s from "@/components/storefront/storefront.module.css";

export default function Page({ params }: { params: { locale: string } }) {
  return (
    <main className={`${s.wrap} ${s.section}`}>
      <div className={s.head}><h1>تسجيل الدخول</h1></div>
      <AuthForm mode="login" locale={params.locale} />
    </main>
  );
}
