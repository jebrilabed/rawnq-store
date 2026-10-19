import { saveProductAction } from "@/app/(admin)/admin/actions";
import type { Category, Product } from "@/lib/types";
import { SubmitButton } from "./Controls";
import { CloudinaryImageField } from "./CloudinaryImageField";
import { ProductOptionsEditor } from "./ProductOptionsEditor";
import s from "./admin.module.css";

export function ProductForm({ product, categories, error }: { product?: Product; categories: Category[]; error?: string }) {
  return (
    <form action={saveProductAction} className={s.form}>
      {error && <p role="alert" className={s.error}>{error}</p>}
      {product && <input type="hidden" name="id" value={product.id} />}
      <label className={s.label}>اسم المنتج<input className={s.field} name="name" defaultValue={product?.name} required maxLength={120} /></label>
      <label className={s.label}>الوصف<textarea className={s.field} name="description" rows={3} defaultValue={product?.description} maxLength={1000} /></label>
      <div className={s.two}>
        <label className={s.label}>القسم
          <select className={s.field} name="categorySlug" defaultValue={product?.categorySlug} required>
            {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
        </label>
        <ProductOptionsEditor
          initial={product?.variants ?? []}
          initialPrice={product?.price}
          initialComparePrice={product?.comparePrice}
          initialStock={product?.variants.length ? product.variants.reduce((sum, variant) => sum + variant.stock, 0) : product?.stock ?? 0}
        />
      </div>
      <CloudinaryImageField initial={product?.image ?? ""} />
      <label className={s.check}><input type="checkbox" name="published" defaultChecked={product?.published ?? true} /> منشور في المتجر</label>
      <SubmitButton className={s.btn}>حفظ المنتج</SubmitButton>
    </form>
  );
}
