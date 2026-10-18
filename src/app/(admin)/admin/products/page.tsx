import Image from "next/image";
import Link from "next/link";
import { deleteProductAction, togglePublishedAction } from "../actions";
import { ConfirmButton } from "@/components/admin/Controls";
import s from "@/components/admin/admin.module.css";
import { stockOf } from "@/lib/data/admin";
import { db } from "@/lib/data/db";

export default function ProductsAdmin() {
  const low = db.settings.lowStockThreshold;
  const cat = (slug: string) => db.categories.find((c) => c.slug === slug)?.name ?? "—";
  return (
    <>
      <div className={s.bar}><h1>المنتجات</h1><Link href="/admin/products/new" className={s.btn}>+ إضافة منتج</Link></div>
      {db.products.map((p) => {
        const stock = stockOf(p);
        return (
          <div key={p.id} className={s.row}>
            <Image src={p.image} alt="" width={60} height={60} />
            <div className={s.grow}>
              <b>{p.name}</b>
              <small>{cat(p.categorySlug)} · {p.price} ₪{p.variants.length > 0 && " · خيارات: لون/حجم"}</small>
            </div>
            <span className={`${s.pill} ${stock <= low ? s.low : s.ok}`}>{stock === 0 ? "نفذ" : `المتوفر: ${stock}`}</span>
            <span className={`${s.pill} ${p.published ? s.ok : ""}`}>{p.published ? "منشور" : "مخفي"}</span>
            <div className={s.act}>
              <form action={togglePublishedAction}><input type="hidden" name="id" value={p.id} /><button className={s.sm}>{p.published ? "إخفاء" : "نشر"}</button></form>
              <Link href={`/admin/products/${p.id}`} className={s.sm}>تعديل</Link>
              <form action={deleteProductAction}><input type="hidden" name="id" value={p.id} /><ConfirmButton className={`${s.sm} ${s.danger}`} message="حذف المنتج؟">حذف</ConfirmButton></form>
            </div>
          </div>
        );
      })}
    </>
  );
}
