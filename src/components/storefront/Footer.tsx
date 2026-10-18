import Link from "next/link";
import { STORE } from "@/lib/config";
import s from "./storefront.module.css";

export function Footer({ locale }: { locale: string }) {
  return (
    <footer className={s.footer}>
      <div className={s.wrap}>
        <div><h4>RAWNQ Home &amp; Living</h4><p>أدوات منزلية عملية بلمسة جمال وجودة.</p></div>
        <div>
          <h4>روابط</h4>
          <ul>
            <li><Link href={`/${locale}/products`}>جميع المنتجات</Link></li>
            <li><Link href={`/${locale}/orders`}>طلباتي</Link></li>
            <li><Link href={`/${locale}/page/about`}>من نحن</Link></li>
            <li><Link href={`/${locale}/page/faq`}>الأسئلة الشائعة</Link></li>
            <li><Link href={`/${locale}/page/delivery`}>التوصيل والاسترجاع</Link></li>
          </ul>
        </div>
        <div>
          <h4>تواصل معنا</h4>
          <ul>
            <li>الهاتف: <span dir="ltr">{STORE.phone}</span></li>
            <li>إنستغرام: <span dir="ltr">{STORE.instagram}</span></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
