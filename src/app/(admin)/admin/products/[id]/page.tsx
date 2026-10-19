import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import s from "@/components/admin/admin.module.css";
import { getAdminProduct } from "@/lib/data/catalog";
import { getCategories } from "@/lib/data/catalog";

export default async function EditProduct({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const [product, categories] = await Promise.all([getAdminProduct(params.id), getCategories()]);
  if (!product) notFound();
  return (<><header className={s.pageHeader}><div><span className={s.eyebrow}>الكتالوج</span><h1>تعديل المنتج</h1><p>{product.name}</p></div></header><ProductForm product={product} categories={categories} error={searchParams.error} /></>);
}
