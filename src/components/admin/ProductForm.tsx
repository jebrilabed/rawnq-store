import { saveProductAction } from "@/app/(admin)/admin/actions";
import { db } from "@/lib/data/db";
import type { Product } from "@/lib/types";
import { VariantsEditor } from "./Controls";
import s from "./admin.module.css";

export function ProductForm({ product, error }: { product?: Product; error?: string }) {
  return (
    <form action={saveProductAction} className={s.form}>
      {error && <p role="alert" className={s.error}>{error}</p>}
      {product && <input type="hidden" name="id" value={product.id} />}
      <label className={s.label}>اسم المنتج<input className={s.field} name="name" defaultValue={product?.name} required maxLength={120} /></label>
      <label className={s.label}>الوصف<textarea className={s.field} name="description" rows={3} defaultValue={product?.description} maxLength={1000} /></label>
      <div className={s.two}>
        <label className={s.label}>السعر (₪)<input className={s.field} name="price" type="number" min={1} step="0.01" defaultValue={product?.price} required /></label>
        <label className={s.label}>السعر قبل الخصم<input className={s.field} name="comparePrice" type="number" min={0} step="0.01" defaultValue={product?.comparePrice} /></label>
      </div>
      <div className={s.two}>
        <label className={s.label}>القسم
          <select className={s.field} name="categorySlug" defaultValue={product?.categorySlug} required>
            {db.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className={s.label}>الكمية (بدون خيارات)<input className={s.field} name="stock" type="number" min={0} defaultValue={product?.stock ?? 0} /></label>
      </div>
      <label className={s.label}>الصورة (مسار أو رابط Cloudinary)<input className={s.field} name="image" defaultValue={product?.image ?? "/products/"} required /></label>
      <label className={s.check}><input type="checkbox" name="published" defaultChecked={product?.published ?? true} /> منشور في المتجر</label>
      <h2 style={{ fontSize: "1rem" }}>الخيارات (اختياري): لون وحجم</h2>
      <VariantsEditor initial={product?.variants ?? []} />
      <button className={s.btn}>حفظ المنتج</button>
    </form>
  );
}
