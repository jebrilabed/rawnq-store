import { AuthForm } from "@/components/storefront/AuthForm";
import s from "@/components/storefront/storefront.module.css";
import { getSettings } from "@/lib/data/db";
import bestRouteAreaCatalog from "@/lib/integrations/best-route-areas.json";
import { translate } from "@/lib/i18n";

export default async function Page({ params, searchParams }: { params: { locale: string }; searchParams: { error?: string } }) {
  const title = translate(params.locale, "إنشاء حساب");
  const { deliveryAreas } = await getSettings(params.locale);
  return (
    <main className={`${s.wrap} ${s.authPage}`}>
      <section className={s.authCard}>
        <div className={s.authTitle}><h1>{title}</h1></div>
        <AuthForm
          mode="register"
          locale={params.locale}
          error={searchParams.error}
          courierAreas={bestRouteAreaCatalog.areas.map((area) => area.name)}
          deliveryAreas={deliveryAreas}
        />
      </section>
    </main>
  );
}
