import { CartView } from "@/components/storefront/CartView";
import s from "@/components/storefront/storefront.module.css";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CartPage({ params }: { params: { locale: string } }) {
  const title = translate(params.locale, "سلة التسوق");
  return (
    <main className={`${s.wrap} ${s.section} ${s.compactPage}`}>
      <div className={s.head}><h1>{title}</h1></div>
      <CartView locale={params.locale} />
    </main>
  );
}
