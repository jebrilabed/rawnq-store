import Image from "next/image";
import { updateStockAction } from "../actions";
import s from "@/components/admin/admin.module.css";
import { stockOf } from "@/lib/data/admin";
import { db } from "@/lib/data/db";

function StockForm({ id, variant, qty }: { id: string; variant?: number; qty: number }) {
  return (
    <form action={updateStockAction} className={s.inline}>
      <input type="hidden" name="id" value={id} />
      {variant !== undefined && <input type="hidden" name="variant" value={variant} />}
      <input className={s.field} style={{ width: 84 }} name="qty" type="number" min={0} defaultValue={qty} aria-label="الكمية" />
      <button className={s.sm}>حفظ</button>
    </form>
  );
}

export default function InventoryAdmin() {
  const low = db.settings.lowStockThreshold;
  const items = [...db.products].sort((a, b) => stockOf(a) - stockOf(b));
  return (
    <>
      <div className={s.bar}><h1>المخزون</h1><span className={s.muted}>حد التنبيه: {low} (يُعدّل من الإعدادات)</span></div>
      {items.map((p) => {
        const total = stockOf(p);
        return (
          <div key={p.id} className={s.row} style={{ alignItems: "flex-start" }}>
            <Image src={p.image} alt="" width={56} height={56} />
            <div className={s.grow}>
              <b>{p.name}</b>
              <span className={`${s.pill} ${total <= low ? s.low : s.ok}`}>{total === 0 ? "نفذ" : `الإجمالي: ${total}`}</span>
              {p.variants.map((v, i) => (
                <div key={i} className={s.inline} style={{ marginTop: 6 }}>
                  <span style={{ minWidth: 110 }}>{[v.color, v.size].filter(Boolean).join(" / ")}</span>
                  <StockForm id={p.id} variant={i} qty={v.stock} />
                </div>
              ))}
            </div>
            {p.variants.length === 0 && <StockForm id={p.id} qty={p.stock} />}
          </div>
        );
      })}
    </>
  );
}
