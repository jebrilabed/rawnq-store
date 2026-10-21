import { AuthForm } from "@/components/storefront/AuthForm";
import s from "@/components/storefront/storefront.module.css";
import { translate } from "@/lib/i18n";

export default function Page({ params, searchParams }: { params: { locale: string }; searchParams: { error?: string; next?: string } }) {
  const title = translate(params.locale, "تسجيل الدخول");
  return (
    <main className={`${s.wrap} ${s.authPage}`}>
      <section className={s.authCard}>
        <div className={s.authTitle}><h1>{title}</h1></div>
        <AuthForm mode="login" locale={params.locale} error={searchParams.error} next={searchParams.next} />
      </section>
    </main>
  );
}
