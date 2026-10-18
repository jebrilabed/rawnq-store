import { ProductForm } from "@/components/admin/ProductForm";
import s from "@/components/admin/admin.module.css";

export default function NewProduct({ searchParams }: { searchParams: { error?: string } }) {
  return (<><div className={s.bar}><h1>منتج جديد</h1></div><ProductForm error={searchParams.error} /></>);
}
