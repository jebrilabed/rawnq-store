import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/storefront/FavoriteButton";
import { VariantPicker } from "@/components/storefront/VariantPicker";
import s from "@/components/storefront/storefront.module.css";
import { getProduct } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

type Props = { params: { locale: string; slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct(params.slug);
  return { title: p ? `${p.name} | RAWNQ` : "RAWNQ" };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();
  return (
    <main className={`${s.wrap} ${s.detail}`}>
      <div className={s.detailImg}><Image src={product.image} alt={product.name} fill priority sizes="(min-width:720px) 50vw, 100vw" /></div>
      <div className={s.panel}>
        <Link href={`/${params.locale}/products`} className={s.muted}>← كل المنتجات</Link>
        <h1>{product.name}</h1>
        <div className={s.favoriteDetail}><FavoriteButton productId={product.id} productName={product.name} /><span>أضف إلى المفضلة</span></div>
        <p className={s.muted}>{product.description}</p>
        <VariantPicker product={product} />
      </div>
    </main>
  );
}
