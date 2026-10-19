"use client";
import { useState } from "react";
import type { DeliveryArea } from "@/lib/data/db";
import s from "./admin.module.css";

type EditableArea = { id: string; name: string; fee: string };

export function DeliveryAreasEditor({ initial }: { initial: DeliveryArea[] }) {
  const [areas, setAreas] = useState<EditableArea[]>(initial.map((area) => ({
    id: area.id, name: area.name, fee: String(area.fee),
  })));

  return (
    <div className={s.deliveryAreas}>
      {areas.map((area, index) => (
        <div key={area.id} className={s.deliveryAreaRow}>
          <label className={s.label}>اسم المنطقة
            <input className={s.field} name="areaName" value={area.name} onChange={(event) => setAreas((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} required maxLength={80} placeholder="مثال: وسط البلد" />
          </label>
          <label className={s.label}>رسوم التوصيل (₪)
            <input className={s.field} name="areaFee" type="number" min={0} max={99999999.99} step="0.5" value={area.fee} onChange={(event) => setAreas((current) => current.map((item, i) => i === index ? { ...item, fee: event.target.value } : item))} required />
          </label>
          <button type="button" className={`${s.sm} ${s.danger}`} onClick={() => setAreas((current) => current.length > 1 ? current.filter((_, i) => i !== index) : current)} disabled={areas.length === 1} aria-label={`حذف منطقة ${area.name || index + 1}`}>حذف</button>
        </div>
      ))}
      <button type="button" className={s.btnGhost} onClick={() => setAreas((current) => [...current, { id: crypto.randomUUID(), name: "", fee: "0" }])}>+ إضافة منطقة توصيل</button>
    </div>
  );
}
