"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { Spinner } from "@/components/ui/LoadingState";
import { toast } from "@/components/ui/Toast";
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
    const wasSelected = selected;
    try {
      await toggle(productId);
      if (!wasSelected) {
        toast.success(`${translate(locale, "تمت إضافة")} "${productName}" ${translate(locale, "إلى المفضلة")}`);
      } else {
        toast.info(`${translate(locale, "تمت إزالة")} "${productName}" ${translate(locale, "من المفضلة")}`);
      }
    } catch {
      toast.error(translate(locale, "تعذر تحديث المفضلة. حاول مرة أخرى."));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className={`${s.favoriteButton} ${compact ? s.favoriteCompact : ""} ${overlay ? s.favoriteOverlay : ""} ${selected ? s.favoriteSelected : ""}`}
      onClick={() => void onClick()}
      aria-label={label}
      aria-pressed={selected}
      aria-busy={pending}
      title={label}
      disabled={!ready || pending}
    >
      {pending ? (
        <Spinner size="small" />
      ) : (
        <Heart size={compact ? 19 : 21} fill={selected ? "currentColor" : "none"} aria-hidden="true" />
      )}
    </button>
  );
}

