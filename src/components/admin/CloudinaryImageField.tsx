"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import s from "./admin.module.css";

export function CloudinaryImageField({ initial }: { initial: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState("");

  useEffect(() => {
    if (!file) { setFilePreview(""); return; }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className={s.label}>
      الصورة
      <input type="hidden" name="image" value={initial} />
      <input
        className={s.field}
        type="file"
        name="productImage"
        accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
        required={!initial}
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        aria-label="اختر صورة المنتج"
      />
      <small className={s.muted}>اختر صورة من جهازك؛ سيتم رفعها عند حفظ المنتج. الحد الأقصى 5 ميغابايت.</small>
      {(filePreview || initial) && (
        <div className={s.imagePreview}>
          <Image src={filePreview || initial} alt="معاينة صورة المنتج" width={480} height={320} unoptimized />
          <span>معاينة صورة المنتج</span>
        </div>
      )}
    </div>
  );
}
