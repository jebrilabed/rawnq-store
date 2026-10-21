import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, ShoppingBag, UserRound } from "lucide-react";
import { updateCustomerProfileAction } from "../auth-actions";
import { auth } from "@/auth";
import s from "@/components/storefront/storefront.module.css";
import { getSettings } from "@/lib/data/db";
import { prisma } from "@/lib/data/prisma";
import bestRouteAreaCatalog from "@/lib/integrations/best-route-areas.json";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params, searchParams }: { params: { locale: string }; searchParams: { saved?: string; error?: string } }) {
  const session = await auth();
  if (session?.user?.role === "ADMIN") redirect("/admin");
  if (session?.user?.role !== "CUSTOMER" || !session.user.id) {
    redirect(`/${params.locale}/login?next=profile`);
  }

  const [customer, settings] = await Promise.all([
    prisma.customerUser.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true, city: true, address: true, deliveryAreaName: true },
    }),
    getSettings(params.locale),
  ]);
  if (!customer) redirect(`/${params.locale}/login?next=profile`);

  const tr = (text: string) => translate(params.locale, text);
  return (
    <main className={`${s.wrap} ${s.section} ${s.profilePage}`}>
      <header className={s.profileHero}>
        <span className={s.profileAvatar}><UserRound size={30} aria-hidden="true" /></span>
        <div>
          <span className={s.profileEyebrow}>{tr("بيانات الحساب")}</span>
          <h1>{customer.name}</h1>
          <p>{tr("إدارة بياناتك ومتابعة طلباتك")}</p>
        </div>
      </header>

      <section className={s.profileCard} aria-label={tr("بيانات الحساب")}>
        <h2>{tr("بيانات الحساب")}</h2>
        {searchParams.saved && <p role="status" className={s.profileSaved}>{tr("تم تحديث بيانات الحساب.")}</p>}
        {searchParams.error && <p role="alert" className={s.error}>{tr("تحقق من البيانات المدخلة.")}</p>}
        <form action={updateCustomerProfileAction} className={`${s.form} ${s.profileForm}`}>
          <input type="hidden" name="locale" value={params.locale} />
          <div className={s.checkoutInputGrid}>
            <label className={s.checkoutLabel}>{tr("الاسم الكامل")}
              <input className={s.input} name="name" defaultValue={customer.name} required minLength={2} maxLength={80} autoComplete="name" />
            </label>
            <div className={s.checkoutLabel}>{tr("البريد الإلكتروني")}
              <div className={s.profileReadOnly}><Mail size={16} aria-hidden="true" /><b dir="ltr">{customer.email}</b></div>
            </div>
            <label className={s.checkoutLabel}>{tr("رقم الهاتف")}
              <input className={`${s.input} ${s.phoneInput}`} name="phone" type="tel" defaultValue={customer.phone} required minLength={8} maxLength={20} autoComplete="tel" />
            </label>
            <label className={s.checkoutLabel}>{tr("المدينة / المنطقة")}
              <select className={s.input} name="city" defaultValue={bestRouteAreaCatalog.areas.some((area) => area.name === customer.city) ? customer.city : ""} required autoComplete="address-level2">
                <option value="" disabled>{tr("اختر المدينة أو المنطقة")}</option>
                {bestRouteAreaCatalog.areas.map((area) => <option key={area.name} value={area.name}>{area.name}</option>)}
              </select>
            </label>
            <label className={s.checkoutLabel}>{tr("منطقة التوصيل")}
              <select className={s.input} name="deliveryAreaName" defaultValue={customer.deliveryAreaName ?? ""} required>
                <option value="" disabled>{tr("اختر منطقة التوصيل.")}</option>
                {settings.deliveryAreas.map((area) => <option key={area.value} value={area.value}>{area.name}</option>)}
              </select>
            </label>
            <label className={`${s.checkoutLabel} ${s.checkoutWide}`}>{tr("العنوان بالتفصيل")}
              <textarea className={`${s.input} ${s.checkoutAddress}`} name="address" defaultValue={customer.address} required minLength={4} maxLength={200} autoComplete="street-address" />
            </label>
          </div>
          <button className={s.btn}>{tr("حفظ البيانات")}</button>
        </form>
        <Link className={s.profileOrdersLink} href={`/${params.locale}/orders`}>
          <ShoppingBag size={18} aria-hidden="true" />
          {tr("طلباتي")}
        </Link>
      </section>
    </main>
  );
}
