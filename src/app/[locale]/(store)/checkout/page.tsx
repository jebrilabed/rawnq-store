import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import s from "@/components/storefront/storefront.module.css";
import { getSettings } from "@/lib/data/db";
import bestRouteAreaCatalog from "@/lib/integrations/best-route-areas.json";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: { locale: string } }) {
  const settings = await getSettings();
  const { deliveryAreas, cod, bank } = settings;
  const bankDetails = [
    settings.bankAccountName && `اسم صاحب الحساب: ${settings.bankAccountName}`,
    settings.bankIban && `الآيبان (IBAN): ${settings.bankIban}`,
    settings.bankAccountNumber && `رقم الحساب: ${settings.bankAccountNumber}`,
  ].filter(Boolean).join("\n") || settings.bankDetails;
  return (
    <main className={`${s.wrap} ${s.section} ${s.compactPage}`}>
      <header className={s.checkoutPageHeader}>
        <div><span>متجر {settings.storeName}</span><h1>إتمام الطلب</h1><p>أدخل بيانات التوصيل، ثم راجع طريقة الدفع والملخص.</p></div>
        <ol className={s.checkoutProgress} aria-label="خطوات إتمام الطلب">
          <li className={s.checkoutProgressActive}><b>01</b><span>التوصيل</span></li>
          <li><b>02</b><span>الدفع</span></li>
          <li><b>03</b><span>التأكيد</span></li>
        </ol>
      </header>
      <CheckoutForm locale={params.locale} areas={deliveryAreas} courierAreas={bestRouteAreaCatalog.areas.map((area) => area.name)} methods={{ cod, bank, bankDetails }} />
    </main>
  );
}
