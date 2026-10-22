"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { uploadProductImageAction } from "@/app/(admin)/admin/actions";
import { Spinner } from "@/components/ui/LoadingState";
import s from "./admin.module.css";

export function CloudinaryImageField({ initial }: { initial: string }) {
  const [image, setImage] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [filePreview, setFilePreview] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) { setFilePreview(""); return; }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function upload() {
    if (!file) { setMessage("اختر صورة أولاً."); return; }
    setBusy(true);
    setMessage("");
    const form = new FormData();
    form.set("image", file);
    try {
      const result = await uploadProductImageAction(form);
      if (result.ok) {
        setImage(result.url);
        setFile(null);
        if (fileInput.current) fileInput.current.value = "";
        setMessage("تم رفع الصورة.");
      }
      else setMessage(result.error);
    } catch {
      setMessage("تعذر رفع الصورة. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.label}>
      الصورة
      <input type="hidden" name="image" value={image} />
      <div className={s.inline}>
        <input ref={fileInput} className={s.field} type="file" accept="image/*" onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setMessage("");
        }} aria-label="اختر صورة المنتج" />
        <button className={s.sm} type="button" disabled={busy} aria-busy={busy} onClick={upload}>
          {busy ? <span className={s.actionPending}><Spinner /> جارٍ الرفع…</span> : "رفع الصورة"}
        </button>
      </div>
      <small className={s.muted}>اختر صورة من جهازك ثم ارفعها. الحد الأقصى 5 ميغابايت.</small>
      {(filePreview || image) && (
        <div className={s.imagePreview}>
          <Image src={filePreview || image} alt="معاينة صورة المنتج" width={480} height={320} unoptimized />
          <span>معاينة صورة المنتج</span>
        </div>
      )}
      {message && <small role="status" className={s.muted}>{message}</small>}
    </div>
  );
}
