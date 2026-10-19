import Image from "next/image";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { updateStockAction } from "../actions";
import { SubmitButton } from "@/components/admin/Controls";
import s from "@/components/admin/admin.module.css";
import { getInventoryProducts, stockOf } from "@/lib/data/admin";
import { getSettings } from "@/lib/data/db";

function StockForm({ id, variant, qty }: { id: string; variant?: string; qty: number }) {
  return (
    <form action={updateStockAction} className={s.inline}>
      <input type="hidden" name="id" value={id} />
      {variant !== undefined && <input type="hidden" name="variant" value={variant} />}
      <input className={`${s.field} ${s.stockInput}`} name="qty" type="number" min={0} defaultValue={qty} aria-label="الكمية" />
      <SubmitButton className={s.sm} pendingLabel="جارٍ الحفظ…">حفظ</SubmitButton>
    </form>
  );
}

export default async function InventoryAdmin() {
  const [products, settings] = await Promise.all([getInventoryProducts(), getSettings()]);
  const low = settings.lowStockThreshold;
  const items = [...products].sort((a, b) => stockOf(a) - stockOf(b));
  const lowItems = items.filter((product) => stockOf(product) <= low).length;
  return (
    <>
      <header className={s.pageHeader}><div><span className={s.eyebrow}>التوريد</span><h1>المخزون</h1><p>الكميات مرتبة من الأقل، مع تعديل مباشر لكل منتج أو خيار.</p></div><Link href="/admin/settings" className={s.btnGhost}>حد التنبيه: {low} · تعديل</Link></header>
      <div className={s.stats}>
        <div className={s.stat}><div className={s.statTop}>منتجات في القائمة</div><b className={s.statValue}>{items.length}</b></div>
        <div className={s.stat}><div className={s.statTop}>تحت حد التنبيه <span className={`${s.statIcon} ${s.redIcon}`}><AlertTriangle size={17} /></span></div><b className={s.statValue}>{lowItems}</b></div>
        <div className={s.stat}><div className={s.statTop}>حد التنبيه</div><b className={s.statValue}>{low}<small> قطعة</small></b></div>
      </div>
      {items.length === 0 ? <div className={s.emptyState}>لا توجد منتجات لمتابعة مخزونها.</div> : (
        <div className={`${s.tableWrap} ${s.inventoryTable}`}><table className={s.table}>
          <thead><tr><th>المنتج</th><th>المخزون الكلي</th><th>الخيار</th><th>الكمية</th></tr></thead>
          <tbody>{items.flatMap((p) => {
            const total = stockOf(p);
            const rows = p.variants.length ? p.variants : [{ id: "base", color: null, size: null, stock: p.stock }];
            return rows.map((variant, index) => <tr key={`${p.id}-${variant.id}`}>
              {index === 0 && <td rowSpan={rows.length}><div className={s.itemCell}><Image className={s.thumb} src={p.image} alt="" width={42} height={42} /><b>{p.name}</b></div></td>}
              {index === 0 && <td rowSpan={rows.length}><span className={`${s.pill} ${total <= low ? s.low : s.ok}`}>{total === 0 ? "نفد" : `${total} قطعة`}</span></td>}
              <td><span className={s.variantLabel}>{[variant.color, variant.size].filter(Boolean).join(" / ") || "أساسي"}</span></td>
              <td><StockForm id={p.id} variant={p.variants.length ? variant.id : undefined} qty={variant.stock} /></td>
            </tr>);
          })}</tbody>
        </table></div>
      )}
    </>
  );
}
