"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "./FavoritesProvider";
import s from "./storefront.module.css";

export function FavoriteButton({ productId, productName, compact = false, overlay = false }: { productId: string; productName: string; compact?: boolean; overlay?: boolean }) {
  const { isFavorite, ready, toggle } = useFavorites();
  const [pending, setPending] = useState(false);
  const selected = isFavorite(productId);
  const label = selected ? `إزالة ${productName} من المفضلة` : `إضافة ${productName} إلى المفضلة`;

  async function onClick() {
    if (!ready || pending) return;
    setPending(true);
    try { await toggle(productId); }
    finally { setPending(false); }
  }

  return (
    <button type="button" className={`${s.favoriteButton} ${compact ? s.favoriteCompact : ""} ${overlay ? s.favoriteOverlay : ""} ${selected ? s.favoriteSelected : ""}`} onClick={() => void onClick()} aria-label={label} aria-pressed={selected} title={label} disabled={!ready || pending}>
      <Heart size={compact ? 19 : 21} fill={selected ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}
