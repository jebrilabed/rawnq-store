import Link from "next/link";
import { getSettings } from "@/lib/data/db";
import s from "./storefront.module.css";
import { translate } from "@/lib/i18n";

function toWhatsAppNumber(value: string) {
  const westernDigits = value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  return westernDigits.replace(/\D/g, "");
}

function instagramUrl(value: string) {
  const account = value.trim().replace(/^@/, "");
  if (!account) return null;

  if (/instagram\.com\//i.test(account)) {
    try {
      const url = new URL(/^https?:\/\//i.test(account) ? account : `https://${account}`);
      if (url.hostname.toLowerCase() === "instagram.com" || url.hostname.toLowerCase() === "www.instagram.com") {
        url.protocol = "https:";
        return url.toString();
      }
    } catch {
      return null;
    }
    return null;
  }

  return /^[A-Za-z0-9._]+$/.test(account)
    ? `https://www.instagram.com/${encodeURIComponent(account)}/`
    : null;
}

export async function Footer({ locale }: { locale: string }) {
  const tr = (text: string) => translate(locale, text);
  const { storeName, phone, whatsapp, instagram } = await getSettings();
  const contactPhone = phone.trim() || whatsapp.trim();
  const whatsappNumber = toWhatsAppNumber(whatsapp.trim() || phone.trim());
  const instagramHref = instagramUrl(instagram);

  return (
    <footer className={s.footer}>
      <div className={s.wrap}>
        <div><h4>{storeName}</h4><p>{tr("أدوات منزلية عملية بلمسة جمال وجودة.")}</p></div>
        <div>
          <h4>{tr("روابط")}</h4>
          <ul>
            <li><Link href={`/${locale}/products`}>{tr("جميع المنتجات")}</Link></li>
            <li><Link href={`/${locale}/orders`}>{tr("طلباتي")}</Link></li>
            <li><Link href={`/${locale}/page/about`}>{tr("من نحن")}</Link></li>
            <li><Link href={`/${locale}/page/faq`}>{tr("الأسئلة الشائعة")}</Link></li>
            <li><Link href={`/${locale}/page/delivery`}>{tr("التوصيل والاسترجاع")}</Link></li>
          </ul>
        </div>
        <div>
          <h4>{tr("تواصل معنا")}</h4>
          <ul>
            {contactPhone && <li>{tr("الهاتف / واتساب:")} {whatsappNumber
              ? <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" dir="ltr">{contactPhone}</a>
              : <span dir="ltr">{contactPhone}</span>}</li>}
            {instagram && <li>{tr("إنستغرام:")} {instagramHref
              ? <a href={instagramHref} target="_blank" rel="noopener noreferrer" dir="ltr">{instagram.trim()}</a>
              : <span dir="ltr">{instagram}</span>}</li>}
          </ul>
        </div>
      </div>
    </footer>
  );
}
