import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/storefront/FavoriteButton";
import { VariantPicker } from "@/components/storefront/VariantPicker";
import s from "@/components/storefront/storefront.module.css";
import { getProduct } from "@/lib/data/catalog";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: { locale: string; slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct(params.slug, params.locale);
  return { title: p ? `${p.name} | RAWNQ` : "RAWNQ" };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug, params.locale);
  if (!product) notFound();
  const tr = (text: string) => translate(params.locale, text);
  return (
    <main className={`${s.wrap} ${s.detail}`}>
      <div className={s.detailImg}><Image src={product.image} alt={product.name} fill priority sizes="(min-width:720px) 50vw, 100vw" /></div>
      <div className={s.panel}>
        <Link href={`/${params.locale}/products`} className={s.muted}>← {tr("كل المنتجات")}</Link>
        <h1>{product.name}</h1>
        <div className={s.favoriteDetail}><FavoriteButton productId={product.id} productName={product.name} locale={params.locale} /><span>{tr("أضف إلى المفضلة")}</span></div>
        <p className={s.muted}>{product.description}</p>
        <VariantPicker product={product} locale={params.locale} />
      </div>
    </main>
  );
}
