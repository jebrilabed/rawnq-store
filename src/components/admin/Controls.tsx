"use client";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateOrderStatusAction } from "@/app/(admin)/admin/actions";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { Spinner } from "@/components/ui/LoadingState";
import { toast } from "@/components/ui/Toast";
import s from "./admin.module.css";

export function StatusSelect({ orderNumber, status }: { orderNumber: string; status: OrderStatus }) {
  const [selected, setSelected] = useState(status);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function changeStatus(next: string) {
    if (pending) return;
    const previous = selected;
    setSelected(next as OrderStatus);
    setPending(true);
    setError("");
    try {
      await updateOrderStatusAction(orderNumber, next);
      const label = STATUS_LABEL[next as OrderStatus] || next;
      toast.success(`تم تحديث حالة الطلب ${orderNumber} إلى "${label}" بنجاح.`);
    } catch {
      setSelected(previous);
      setError("تعذر تحديث حالة الطلب. حاول مرة أخرى.");
      toast.error("تعذر تحديث حالة الطلب. حاول مرة أخرى.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className={s.statusControl} aria-busy={pending}>
      <select className={s.select} value={selected} disabled={pending} aria-label="حالة الطلب"
        onChange={(e) => { void changeStatus(e.currentTarget.value); }}>
        {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
      </select>
      {pending && <span className={s.actionPending} role="status"><Spinner /> جارٍ تحديث الحالة…</span>}
      {error && <span role="alert" className={s.muted}>{error}</span>}
    </span>
  );
}

export function ConfirmButton({ children, message, className, pendingLabel = "جارٍ الحذف…" }: { children: React.ReactNode; message: string; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending} aria-busy={pending} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
    {pending ? <span className={s.actionPending}><Spinner /> {pendingLabel}</span> : children}
  </button>;
}

export function SubmitButton({ children, className, pendingLabel = "جارٍ الحفظ…" }: { children: React.ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending} aria-busy={pending}>
    {pending ? <span className={s.actionPending}><Spinner /> {pendingLabel}</span> : children}
  </button>;
}

type AxisOption = { id: string; name: string };
type SizeOption = AxisOption & { price: string };
type Variant = { color?: string; size?: string; stock: number; price?: number };

const NO_COLOR = "__no_color__";
const NO_SIZE = "__no_size__";
const cellKey = (colorId?: string, sizeId?: string) => `${colorId ?? NO_COLOR}:${sizeId ?? NO_SIZE}`;
const optionKey = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

/** مصفوفة الألوان والأحجام: المخزون لكل تركيبة، والسعر مشترك بين ألوان الحجم الواحد. */
export function VariantsEditor({ initial, initialStock = 0, onBaseStockChange, requirePrices = false, defaultPrice }: { initial: Variant[]; initialStock?: number; onBaseStockChange?: (stock: number) => void; requirePrices?: boolean; defaultPrice?: number }) {
  const colorNames = Array.from(new Set(initial.flatMap((variant) => variant.color?.trim() ? [variant.color.trim()] : [])));
  const sizeNames = Array.from(new Set(initial.flatMap((variant) => variant.size?.trim() ? [variant.size.trim()] : [])));
  const initialColorIds = new Map<string, string>(colorNames.map((name, index): [string, string] => [name, `color-${index}`]));
  const initialSizeIds = new Map<string, string>(sizeNames.map((name, index): [string, string] => [name, `size-${index}`]));

  const [colors, setColors] = useState<AxisOption[]>(() => colorNames.map((name, index) => ({ id: `color-${index}`, name })));
  const [sizes, setSizes] = useState<SizeOption[]>(() => sizeNames.map((name, index) => ({
    id: `size-${index}`,
    name,
    price: String(initial.find((variant) => variant.size?.trim() === name && variant.price != null)?.price ?? defaultPrice ?? ""),
  })));
  const [stocks, setStocks] = useState<Record<string, string>>(() => Object.fromEntries(initial.map((variant): [string, string] => [
    cellKey(
      variant.color?.trim() ? initialColorIds.get(variant.color.trim()) : undefined,
      variant.size?.trim() ? initialSizeIds.get(variant.size.trim()) : undefined,
    ),
    String(variant.stock),
  ])));
  const [colorPrices, setColorPrices] = useState<Record<string, string>>(() => Object.fromEntries(colorNames.map((name) => {
    const colorId = initialColorIds.get(name)!;
    const variantPrice = initial.find((variant) => variant.color?.trim() === name && variant.price != null)?.price;
    return [colorId, String(variantPrice ?? defaultPrice ?? "")];
  })));
  const [colorInput, setColorInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [error, setError] = useState("");
  const colorSequence = useRef(colorNames.length);
  const sizeSequence = useRef(sizeNames.length);

  function addColor() {
    const name = colorInput.trim().replace(/\s+/g, " ");
    if (!name) { setError("اكتب اسم اللون أولاً."); return; }
    if (colors.some((color) => optionKey(color.name) === optionKey(name))) { setError("هذا اللون مضاف مسبقاً."); return; }
    if ((colors.length + 1) * Math.max(1, sizes.length) > 100) { setError("يمكن إضافة 100 تركيبة لون وحجم كحد أقصى."); return; }
    const id = `color-${colorSequence.current++}`;
    if (colors.length === 0) {
      setStocks((current) => {
        const next = { ...current };
        (sizes.length ? sizes : [null]).forEach((size) => {
          next[cellKey(id, size?.id)] = current[cellKey(undefined, size?.id)] ?? String(initialStock);
        });
        return next;
      });
    }
    setColors((current) => [...current, { id, name }]);
    setColorInput("");
    setError("");
  }

  function addSize() {
    const name = sizeInput.trim().replace(/\s+/g, " ");
    if (!name) { setError("اكتب اسم الحجم أولاً."); return; }
    if (sizes.some((size) => optionKey(size.name) === optionKey(name))) { setError("هذا الحجم مضاف مسبقاً."); return; }
    if (Math.max(1, colors.length) * (sizes.length + 1) > 100) { setError("يمكن إضافة 100 تركيبة لون وحجم كحد أقصى."); return; }
    const id = `size-${sizeSequence.current++}`;
    const colorValues = colors.map((color) => colorPrices[color.id]).filter(Boolean);
    const sharedColorPrice = colorValues.length > 0 && colorValues.length === colors.length && colorValues.every((price) => price === colorValues[0]) ? colorValues[0] ?? "" : "";
    if (sizes.length === 0) {
      setStocks((current) => {
        const next = { ...current };
        (colors.length ? colors : [null]).forEach((color) => {
          next[cellKey(color?.id, id)] = current[cellKey(color?.id, undefined)] ?? String(initialStock);
        });
        return next;
      });
    }
    setSizes((current) => [...current, { id, name, price: sizes.length === 0 ? sharedColorPrice : "" }]);
    setSizeInput("");
    setError("");
  }

  function removeColor(color: AxisOption) {
    if (colors.length === 1 && sizes.length > 0) {
      setStocks((current) => {
        const next = { ...current };
        sizes.forEach((size) => { next[cellKey(undefined, size.id)] = current[cellKey(color.id, size.id)] ?? "0"; });
        return next;
      });
    } else if (colors.length === 1) {
      onBaseStockChange?.(Number(stocks[cellKey(color.id)] || 0));
    }
    setColors((current) => current.filter((item) => item.id !== color.id));
  }

  function removeSize(size: SizeOption) {
    if (sizes.length === 1 && colors.length > 0) {
      setStocks((current) => {
        const next = { ...current };
        colors.forEach((color) => { next[cellKey(color.id, undefined)] = current[cellKey(color.id, size.id)] ?? "0"; });
        return next;
      });
      setColorPrices(Object.fromEntries(colors.map((color): [string, string] => [color.id, size.price])));
    } else if (sizes.length === 1) {
      onBaseStockChange?.(Number(stocks[cellKey(undefined, size.id)] || 0));
    }
    setSizes((current) => current.filter((item) => item.id !== size.id));
  }

  const colorRows: (AxisOption | null)[] = colors.length ? colors : [null];
  const sizeColumns: (SizeOption | null)[] = sizes.length ? sizes : [null];
  const variants = colors.length || sizes.length
    ? colorRows.flatMap((color) => sizeColumns.map((size) => ({
      color: color?.name,
      size: size?.name,
      stock: Number(stocks[cellKey(color?.id, size?.id)] || 0),
      price: size ? size.price : color ? colorPrices[color.id] ?? "" : "",
    })))
    : [];

  return (
    <div className={s.variantEditor}>
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <p className={s.muted}>أضف ألوانك وأحجامك؛ كل حجم يظهر كعمود وكل لون كسطر، والكمية تُسجل في خانة التقاطع. سعر الحجم يطبق على جميع ألوانه.</p>
      {error && <p role="alert" className={s.error}>{error}</p>}

      <div className={s.variantAxes}>
        <section className={s.variantAxis} aria-labelledby="variant-colors-title">
          <h3 id="variant-colors-title">الألوان</h3>
          <div className={s.variantAddRow}>
            <input className={s.field} value={colorInput} onChange={(event) => setColorInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addColor(); } }} placeholder="مثال: أبيض" maxLength={40} aria-label="اسم اللون الجديد" />
            <button type="button" className={s.sm} onClick={addColor}>+ إضافة لون</button>
          </div>
          <div className={s.variantTags} aria-label="الألوان المضافة">
            {colors.map((color) => <span key={color.id} className={s.variantTag}>{color.name}<button type="button" className={s.variantRemove} onClick={() => removeColor(color)} aria-label={`حذف اللون ${color.name}`}>×</button></span>)}
          </div>
        </section>

        <section className={s.variantAxis} aria-labelledby="variant-sizes-title">
          <h3 id="variant-sizes-title">الأحجام</h3>
          <div className={s.variantAddRow}>
            <input className={s.field} value={sizeInput} onChange={(event) => setSizeInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSize(); } }} placeholder="مثال: كبير" maxLength={40} aria-label="اسم الحجم الجديد" />
            <button type="button" className={s.sm} onClick={addSize}>+ إضافة حجم</button>
          </div>
          <div className={s.variantTags} aria-label="الأحجام المضافة">
            {sizes.map((size) => <span key={size.id} className={s.variantTag}>{size.name}<button type="button" className={s.variantRemove} onClick={() => removeSize(size)} aria-label={`حذف الحجم ${size.name}`}>×</button></span>)}
          </div>
        </section>
      </div>

      {variants.length === 0 ? (
        <div className={s.emptyState}>أضف لوناً أو حجماً واحداً على الأقل لإنشاء جدول الأسعار والكميات.</div>
      ) : (
        <div className={`${s.tableWrap} ${s.variantMatrixWrap}`}>
          <table className={`${s.table} ${s.variantMatrix}`}>
            <thead>
              <tr>
                <th scope="col">{colors.length ? "اللون" : "الخيار"}</th>
                {sizes.length > 0 ? sizes.map((size) => (
                  <th scope="col" key={size.id}>
                    <div className={s.matrixSizeHead}>
                      <span>{size.name}</span>
                      <label className={s.matrixPrice}>السعر (₪)
                        <input className={s.field} type="number" min={0.01} step="0.01" value={size.price} placeholder="السعر" required={requirePrices} aria-label={`سعر الحجم ${size.name}`} onChange={(event) => setSizes((current) => current.map((item) => item.id === size.id ? { ...item, price: event.target.value } : item))} />
                      </label>
                    </div>
                  </th>
                )) : <>
                  {colors.length > 0 && <th scope="col">السعر (₪)</th>}
                  <th scope="col">الكمية</th>
                </>}
              </tr>
            </thead>
            <tbody>
              {colorRows.map((color) => (
                <tr key={color?.id ?? NO_COLOR}>
                  <th scope="row">{color?.name ?? (sizes.length ? "بدون لون" : "الكمية")}</th>
                  {sizes.length === 0 && color && <td>
                    <input className={s.field} type="number" min={0.01} step="0.01" value={colorPrices[color.id] ?? ""} placeholder="السعر" required={requirePrices} aria-label={`سعر اللون ${color.name}`} onChange={(event) => setColorPrices((current) => ({ ...current, [color.id]: event.target.value }))} />
                  </td>}
                  {sizeColumns.map((size) => {
                    const quantityKey = cellKey(color?.id, size?.id);
                    return <td key={size?.id ?? NO_SIZE}>
                      <input className={`${s.field} ${s.matrixStock}`} type="number" min={0} step={1} value={stocks[quantityKey] ?? "0"} aria-label={`الكمية ${color ? `للون ${color.name}` : "بدون لون"}${size ? `، الحجم ${size.name}` : ""}`} onChange={(event) => setStocks((current) => ({ ...current, [quantityKey]: event.target.value }))} />
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={s.muted}>{requirePrices ? "أدخل سعر كل خيار؛ سعر المنتج الأساسي سيكون أقل سعر في الجدول. المخزون يساوي مجموع الكميات." : "اترك السعر فارغاً لاستخدام سعر المنتج الأساسي. المخزون الكلي للمنتج يساوي مجموع كميات الخانات."}</p>
    </div>
  );
}
