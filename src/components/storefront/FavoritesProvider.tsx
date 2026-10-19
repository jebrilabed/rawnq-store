"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setFavoriteAction } from "@/app/[locale]/(store)/favorites/actions";

const STORAGE_KEY = "rawnq-favorites";
type FavoritesContextValue = {
  ids: string[];
  count: number;
  ready: boolean;
  isFavorite: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
};
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children, initialIds, authenticated }: {
  children: React.ReactNode;
  initialIds: string[];
  authenticated: boolean;
}) {
  const [ids, setIds] = useState(initialIds);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authenticated) {
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        setIds(Array.isArray(stored) ? [...new Set(stored.filter((id): id is string => typeof id === "string"))] : []);
      } catch {
        setIds([]);
      }
    }
    setReady(true);
  }, [authenticated]);

  const isFavorite = useCallback((productId: string) => ids.includes(productId), [ids]);
  const toggle = useCallback(async (productId: string) => {
    const wasSelected = ids.includes(productId);
    const nextIds = wasSelected ? ids.filter((id) => id !== productId) : [...ids, productId];
    setIds(nextIds);
    if (authenticated) {
      try {
        const result = await setFavoriteAction(productId, !wasSelected);
        if (!result.ok) setIds(ids);
      } catch {
        setIds(ids);
      }
      return;
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds)); } catch { /* Storage can be disabled. */ }
  }, [authenticated, ids]);

  const value = useMemo(() => ({ ids, count: ids.length, ready, isFavorite, toggle }), [ids, ready, isFavorite, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return context;
}
