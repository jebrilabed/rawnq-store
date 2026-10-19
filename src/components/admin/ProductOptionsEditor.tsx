"use client";
import { useState } from "react";
import type { Variant } from "@/lib/types";
import { VariantsEditor } from "./Controls";
import s from "./admin.module.css";

export function ProductOptionsEditor({ initial, initialPrice, initialComparePrice, initialStock }: {
  initial: Variant[];
  initialPrice?: number;
  initialComparePrice?: number;
  initialStock: number;
}) {
  const [stock, setStock] = useState(String(initialStock));
  const [price, setPrice] = useState(initialPrice == null ? "" : String(initialPrice));
  const [comparePrice, setComparePrice] = useState(initialComparePrice == null ? "" : String(initialComparePrice));
  const [hasVariants, setHasVariants] = useState(initial.length > 0);

  return (
    <div className={s.productOptions}>
      <label className={s.check}>
        <input type="checkbox" name="hasVariants" checked={hasVariants} onChange={(event) => setHasVariants(event.target.checked)} />
        هل المنتج يحتوي على ألوان وأحجام؟
      </label>
      {!hasVariants ? (
        <div className={s.baseProductFields}>
          <label className={s.label}>السعر (₪)
            <input className={s.field} name="price" type="number" min={0.01} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
          </label>
          <label className={s.label}>السعر قبل الخصم (₪)
            <input className={s.field} name="comparePrice" type="number" min={0.01} step="0.01" value={comparePrice} onChange={(event) => setComparePrice(event.target.value)} />
          </label>
          <label className={s.label}>الكمية
            <input className={s.field} name="stock" type="number" min={0} step={1} value={stock} onChange={(event) => setStock(event.target.value)} required />
          </label>
        </div>
      ) : (
        <div className={s.variantSection}>
          <h2 className={s.optionHeading}>أسعار وكميات الخيارات</h2>
          <VariantsEditor initial={initial} initialStock={Number(stock) || 0} onBaseStockChange={(value) => setStock(String(value))} defaultPrice={initialPrice} requirePrices />
        </div>
      )}
    </div>
  );
}
