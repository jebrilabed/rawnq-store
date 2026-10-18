import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import s from "@/components/admin/admin.module.css";
import { db } from "@/lib/data/db";

export default function EditProduct({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const product = db.products.find((p) => p.id === params.id);
  if (!product) notFound();
  return (<><div className={s.bar}><h1>تعديل: {product.name}</h1></div><ProductForm product={product} error={searchParams.error} /></>);
}
