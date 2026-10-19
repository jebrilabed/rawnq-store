"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { parseCart, type CartLine } from "@/lib/cart";

export type { CartLine } from "@/lib/cart";
type Ctx = {
  lines: CartLine[]; count: number; subtotal: number;
  add: (line: Omit<CartLine, "qty"> & { qty?: number }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "rawnq-cart";

/** Keep cart selections on the device; checkout rechecks catalog prices and stock on the server. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setLines(parseCart(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"))); } catch { setLines([]); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); } catch { /* ignore */ }
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "qty"> & { qty?: number }) => {
    const quantity = Math.max(1, Math.min(99, Math.trunc(line.qty ?? 1)));
    setLines((cur) => cur.some((l) => l.key === line.key)
      ? cur.map((l) => (l.key === line.key ? { ...l, qty: Math.min(99, l.qty + quantity) } : l))
      : [...cur, { ...line, qty: quantity }]);
  }, []);
  const setQty = useCallback((key: string, qty: number) => {
    const nextQty = Number.isFinite(qty) ? Math.min(99, Math.trunc(qty)) : 0;
    setLines((cur) => cur.map((l) => (l.key === key ? { ...l, qty: nextQty } : l)).filter((l) => l.qty > 0));
  }, []);
  const remove = useCallback((key: string) => setLines((cur) => cur.filter((l) => l.key !== key)), []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<Ctx>(() => ({
    lines, add, setQty, remove, clear,
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal: lines.reduce((n, l) => n + l.qty * l.price, 0),
  }), [lines, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
