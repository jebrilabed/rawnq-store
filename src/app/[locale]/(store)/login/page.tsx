import { AuthForm } from "@/components/storefront/AuthForm";
import s from "@/components/storefront/storefront.module.css";

export default function Page({ params, searchParams }: { params: { locale: string }; searchParams: { error?: string; next?: string } }) {
  return (
    <main className={`${s.wrap} ${s.authPage}`}>
      <section className={s.authCard}>
        <div className={s.authTitle}><h1>تسجيل الدخول</h1></div>
        <AuthForm mode="login" locale={params.locale} error={searchParams.error} next={searchParams.next} />
      </section>
    </main>
  );
}
