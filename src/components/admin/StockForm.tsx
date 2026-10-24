"use client";

import { useState } from "react";
import { updateStockAction } from "@/app/(admin)/admin/actions";
import { Spinner } from "@/components/ui/LoadingState";
import { toast } from "@/components/ui/Toast";
import s from "./admin.module.css";

export function StockForm({ id, variant, qty }: { id: string; variant?: string; qty: number }) {
  const [stockValue, setStockValue] = useState(qty);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const formData = new FormData();
    formData.set("id", id);
    if (variant !== undefined) formData.set("variant", variant);
    formData.set("qty", String(stockValue));

    setPending(true);
    try {
      await updateStockAction(formData);
      toast.success("تم تحديث كمية المخزون بنجاح.");
    } catch {
      toast.error("تعذر تحديث كمية المخزون. حاول مرة أخرى.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={s.inline}>
      <input
        className={`${s.field} ${s.stockInput}`}
        name="qty"
        type="number"
        min={0}
        value={stockValue}
        onChange={(e) => setStockValue(Math.max(0, parseInt(e.target.value) || 0))}
        disabled={pending}
        aria-label="الكمية"
      />
      <button
        type="submit"
        className={s.sm}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <span className={s.actionPending}>
            <Spinner /> جارٍ الحفظ…
          </span>
        ) : (
          "حفظ"
        )}
      </button>
    </form>
  );
}
