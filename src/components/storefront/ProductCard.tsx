import Image from "next/image";
import Link from "next/link";
import { discountPercent, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";
import s from "./storefront.module.css";

export function ProductCard({ product, locale }: { product: Product; locale: string }) {
  const off = discountPercent(product.price, product.comparePrice);
  return (
    <article className={s.card}>
      <div className={s.thumb}>
        <Link href={`/${locale}/products/${product.slug}`} className={s.productImageLink} aria-label={product.name}>
          <Image src={product.image} alt={product.name} fill sizes="(min-width:1000px) 25vw, (min-width:720px) 33vw, 50vw" />
        </Link>
        {off > 0 && <span className={s.tag}>خصم {off}%</span>}
        <FavoriteButton productId={product.id} productName={product.name} compact overlay />
      </div>
      <Link href={`/${locale}/products/${product.slug}`} className={s.info}>
        <h3>{product.name}</h3>
        <div className={s.price}>
          {formatPrice(product.price)}
          {product.comparePrice && <s>{formatPrice(product.comparePrice)}</s>}
        </div>
      </Link>
    </article>
  );
}
