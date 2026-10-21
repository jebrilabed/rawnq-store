import { AuthForm } from "@/components/storefront/AuthForm";
import s from "@/components/storefront/storefront.module.css";
import { translate } from "@/lib/i18n";

export default function Page({ params, searchParams }: { params: { locale: string }; searchParams: { error?: string } }) {
  const title = translate(params.locale, "إنشاء حساب");
  return (
    <main className={`${s.wrap} ${s.authPage}`}>
      <section className={s.authCard}>
        <div className={s.authTitle}><h1>{title}</h1></div>
        <AuthForm mode="register" locale={params.locale} error={searchParams.error} />
      </section>
    </main>
  );
}
