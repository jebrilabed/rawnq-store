"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { key: string; slug: string; name: string; image: string; price: number; qty: number; option?: string };
type Ctx = {
  lines: CartLine[]; count: number; subtotal: number;
  add: (line: Omit<CartLine, "qty">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "rawnq-cart";

/**
 * سلة على جهاز الزبون للتصميم فقط. في الإنتاج استخدم سلة الخادم
 * (رمز ضيف مُجزّأ + Server Actions) والتحقق من السعر والمخزون من قاعدة البيانات.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setLines(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); } catch { /* ignore */ }
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "qty">) => {
    setLines((cur) => cur.some((l) => l.key === line.key)
      ? cur.map((l) => (l.key === line.key ? { ...l, qty: l.qty + 1 } : l))
      : [...cur, { ...line, qty: 1 }]);
  }, []);
  const setQty = useCallback((key: string, qty: number) => {
    setLines((cur) => cur.map((l) => (l.key === key ? { ...l, qty } : l)).filter((l) => l.qty > 0));
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
