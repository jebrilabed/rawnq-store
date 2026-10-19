import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { deleteProductAction, togglePublishedAction } from "../actions";
import { ConfirmButton, SubmitButton } from "@/components/admin/Controls";
import s from "@/components/admin/admin.module.css";
import { getAdminProducts, stockOf } from "@/lib/data/admin";
import { getSettings } from "@/lib/data/db";
import { formatPrice } from "@/lib/format";

export default async function ProductsAdmin() {
  const [products, settings] = await Promise.all([getAdminProducts(), getSettings()]);
  const low = settings.lowStockThreshold;
  const lowCount = products.filter((product) => stockOf(product) <= low).length;
  const publishedCount = products.filter((product) => product.published).length;
  return (
    <>
      <header className={s.pageHeader}>
        <div><span className={s.eyebrow}>الكتالوج</span><h1>المنتجات</h1><p>إدارة تفاصيل المنتجات والأسعار والنشر والمخزون.</p></div>
        <Link href="/admin/products/new" className={s.btn}><Plus size={17} /> إضافة منتج</Link>
      </header>
      <div className={s.stats}>
        <div className={s.stat}><div className={s.statTop}>كل المنتجات</div><b className={s.statValue}>{products.length}</b></div>
        <div className={s.stat}><div className={s.statTop}>منشور</div><b className={s.statValue}>{publishedCount}</b></div>
        <div className={s.stat}><div className={s.statTop}>يحتاج مراجعة المخزون</div><b className={s.statValue}>{lowCount}</b></div>
      </div>
      {products.length === 0 ? <div className={s.emptyState}>لا توجد منتجات بعد. أضف أول منتج إلى الكتالوج.</div> : (
        <div className={s.tableWrap}><table className={s.table}>
          <thead><tr><th>المنتج</th><th>القسم</th><th>السعر</th><th>المخزون</th><th>النشر</th><th>الإجراءات</th></tr></thead>
          <tbody>{products.map((p) => {
            const stock = stockOf(p);
            return <tr key={p.id}>
              <td><div className={s.itemCell}><Image className={s.thumb} src={p.image} alt="" width={42} height={42} /><div><b>{p.name}</b>{p.variants.length > 0 && <small>متعدد الخيارات</small>}</div></div></td>
              <td>{p.category.name}</td><td><b>{formatPrice(p.price)}</b></td>
              <td><span className={`${s.pill} ${stock <= low ? s.low : s.ok}`}>{stock === 0 ? "نفد" : stock}</span></td>
              <td><span className={`${s.pill} ${p.published ? s.ok : s.warning}`}>{p.published ? "منشور" : "مخفي"}</span></td>
              <td><div className={s.cellActions}>
                <form action={togglePublishedAction}><input type="hidden" name="id" value={p.id} /><SubmitButton className={s.sm} pendingLabel="جارٍ…">{p.published ? "إخفاء" : "نشر"}</SubmitButton></form>
                <Link href={`/admin/products/${p.id}`} className={s.sm}>تعديل</Link>
                <form action={deleteProductAction}><input type="hidden" name="id" value={p.id} /><ConfirmButton className={`${s.sm} ${s.danger}`} message="حذف المنتج؟">حذف</ConfirmButton></form>
              </div></td>
            </tr>;
          })}</tbody>
        </table></div>
      )}
    </>
  );
}
