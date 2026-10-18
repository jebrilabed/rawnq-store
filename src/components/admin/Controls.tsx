"use client";
import { useState, useTransition } from "react";
import { updateOrderStatusAction } from "@/app/(admin)/admin/actions";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import s from "./admin.module.css";

export function StatusSelect({ orderNumber, status }: { orderNumber: string; status: OrderStatus }) {
  const [pending, start] = useTransition();
  return (
    <select className={s.select} defaultValue={status} disabled={pending} aria-label="حالة الطلب"
      onChange={(e) => start(() => updateOrderStatusAction(orderNumber, e.target.value))}>
      {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
    </select>
  );
}

export function ConfirmButton({ children, message, className }: { children: React.ReactNode; message: string; className?: string }) {
  return <button className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>{children}</button>;
}

type Row = { color: string; size: string; stock: string; price: string };

/** جدول التراكيب: اللون والحجم والكمية والسعر. الصف الفارغ يُهمل؛ السعر الفارغ = سعر المنتج. */
export function VariantsEditor({ initial }: { initial: { color?: string; size?: string; stock: number; price?: number }[] }) {
  const [rows, setRows] = useState<Row[]>(initial.map((v) => ({ color: v.color ?? "", size: v.size ?? "", stock: String(v.stock), price: v.price ? String(v.price) : "" })));
  const set = (i: number, k: keyof Row, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const json = JSON.stringify(rows.map((r) => ({ color: r.color, size: r.size, stock: Number(r.stock || 0), price: r.price })));
  return (
    <div>
      <input type="hidden" name="variants" value={json} />
      {rows.length > 0 && <div className={s.vh}><span>اللون</span><span>الحجم</span><span>الكمية</span><span>السعر</span><span /></div>}
      {rows.map((r, i) => (
        <div key={i} className={s.vr}>
          <input className={s.field} value={r.color} onChange={(e) => set(i, "color", e.target.value)} placeholder="اللون" />
          <input className={s.field} value={r.size} onChange={(e) => set(i, "size", e.target.value)} placeholder="الحجم" />
          <input className={s.field} type="number" min={0} value={r.stock} onChange={(e) => set(i, "stock", e.target.value)} />
          <input className={s.field} type="number" min={0} value={r.price} onChange={(e) => set(i, "price", e.target.value)} placeholder="أساسي" />
          <button type="button" className={`${s.sm} ${s.danger}`} onClick={() => setRows((x) => x.filter((_, j) => j !== i))} aria-label="حذف">×</button>
        </div>
      ))}
      <button type="button" className={s.btnGhost} style={{ marginTop: 8 }} onClick={() => setRows((x) => [...x, { color: "", size: "", stock: "0", price: "" }])}>
        + إضافة تركيبة (لون / حجم)
      </button>
      <p className={s.muted} style={{ marginTop: 6 }}>لو للمنتج لون فقط أو حجم فقط اترك الخانة الأخرى فارغة. مخزون المنتج الكلي = مجموع الكميات.</p>
    </div>
  );
}
