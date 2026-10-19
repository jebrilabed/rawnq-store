import { ProductForm } from "@/components/admin/ProductForm";
import s from "@/components/admin/admin.module.css";
import { getCategories } from "@/lib/data/catalog";

export default async function NewProduct({ searchParams }: { searchParams: { error?: string } }) {
  const categories = await getCategories();
  return (<><header className={s.pageHeader}><div><span className={s.eyebrow}>الكتالوج</span><h1>منتج جديد</h1><p>أضف بيانات المنتج والسعر والمخزون والصورة.</p></div></header><ProductForm categories={categories} error={searchParams.error} /></>);
}
