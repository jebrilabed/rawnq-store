"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "./FavoritesProvider";
import s from "./storefront.module.css";
import { translate } from "@/lib/i18n";

export function FavoriteButton({ productId, productName, locale = "ar", compact = false, overlay = false }: { productId: string; productName: string; locale?: string; compact?: boolean; overlay?: boolean }) {
  const { isFavorite, ready, toggle } = useFavorites();
  const [pending, setPending] = useState(false);
  const selected = isFavorite(productId);
  const label = `${translate(locale, selected ? "إزالة من المفضلة" : "إضافة إلى المفضلة")}: ${productName}`;

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
