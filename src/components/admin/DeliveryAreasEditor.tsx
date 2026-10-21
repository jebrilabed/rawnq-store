"use client";
import { useState } from "react";
import type { DeliveryArea } from "@/lib/data/db";
import s from "./admin.module.css";

type EditableArea = { id: string; name: string; fee: string; translations: Record<string, string> };

export function DeliveryAreasEditor({ initial }: { initial: DeliveryArea[] }) {
  const [areas, setAreas] = useState<EditableArea[]>(initial.map((area) => {
    let translations: Record<string, string> = {};
    try {
      const parsed: unknown = JSON.parse(area.translations);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) translations = parsed as Record<string, string>;
    } catch (cause) {
      console.error("Invalid delivery area translations.", cause);
    }
    return { id: area.id, name: area.name, fee: String(area.fee), translations };
  }));

  return (
    <div className={s.deliveryAreas}>
      {areas.map((area, index) => (
        <div key={area.id} className={s.deliveryAreaRow}>
          <input type="hidden" name="areaName_en" value={area.translations.en ?? ""} />
          <input type="hidden" name="areaName_he" value={area.translations.he ?? ""} />
          <input type="hidden" name="areaName_ru" value={area.translations.ru ?? ""} />
          <label className={s.label}>اسم المنطقة
            <input className={s.field} name="areaName" value={area.name} onChange={(event) => setAreas((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} required maxLength={80} placeholder="مثال: وسط البلد" />
          </label>
          <label className={s.label}>رسوم التوصيل (₪)
            <input className={s.field} name="areaFee" type="number" min={0} max={99999999.99} step="0.5" value={area.fee} onChange={(event) => setAreas((current) => current.map((item, i) => i === index ? { ...item, fee: event.target.value } : item))} required />
          </label>
          <button type="button" className={`${s.sm} ${s.danger}`} onClick={() => setAreas((current) => current.length > 1 ? current.filter((_, i) => i !== index) : current)} disabled={areas.length === 1} aria-label={`حذف منطقة ${area.name || index + 1}`}>حذف</button>
          <details className={s.localizedFields}>
            <summary>ترجمة اسم المنطقة</summary>
            <input className={s.field} value={area.translations.en ?? ""} onChange={(event) => setAreas((current) => current.map((item, i) => i === index ? { ...item, translations: { ...item.translations, en: event.target.value } } : item))} maxLength={80} placeholder="English name" />
            <input className={s.field} value={area.translations.he ?? ""} onChange={(event) => setAreas((current) => current.map((item, i) => i === index ? { ...item, translations: { ...item.translations, he: event.target.value } } : item))} maxLength={80} placeholder="שם בעברית" />
            <input className={s.field} value={area.translations.ru ?? ""} onChange={(event) => setAreas((current) => current.map((item, i) => i === index ? { ...item, translations: { ...item.translations, ru: event.target.value } } : item))} maxLength={80} placeholder="Название на русском" />
          </details>
        </div>
      ))}
      <button type="button" className={s.btnGhost} onClick={() => setAreas((current) => [...current, { id: crypto.randomUUID(), name: "", fee: "0", translations: {} }])}>+ إضافة منطقة توصيل</button>
    </div>
  );
}
