import { AuthForm } from "@/components/storefront/AuthForm";
import s from "@/components/storefront/storefront.module.css";

export default function Page({ params, searchParams }: { params: { locale: string }; searchParams: { error?: string } }) {
  return (
    <main className={`${s.wrap} ${s.authPage}`}>
      <section className={s.authCard}>
        <div className={s.authTitle}><h1>إنشاء حساب</h1></div>
        <AuthForm mode="register" locale={params.locale} error={searchParams.error} />
      </section>
    </main>
  );
}
