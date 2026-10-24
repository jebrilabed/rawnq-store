"use client";
import { useState } from "react";
import { checkBestRouteConnectionAction } from "@/app/(admin)/admin/actions";
import { Spinner } from "@/components/ui/LoadingState";
import { toast } from "@/components/ui/Toast";
import type { BestRouteConnectionCheck as CheckResult } from "@/lib/integrations/best-route";
import s from "./admin.module.css";

const labels: { key: keyof Omit<CheckResult, "checkedAt">; label: string }[] = [
  { key: "areas", label: "المناطق" },
  { key: "subAreas", label: "المناطق الفرعية" },
  { key: "statuses", label: "حالات الشحن" },
  { key: "orderTypes", label: "أنواع الطلبات" },
];

export function BestRouteConnectionCheck() {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [pending, setPending] = useState(false);

  async function check() {
    if (pending) return;
    setPending(true);
    try {
      const data = await checkBestRouteConnectionAction();
      setResult(data);
      const allOk = Object.values(data).every((val) => typeof val === "object" && val && "ok" in val && (val as { ok: boolean }).ok);
      if (allOk) {
        toast.success("تم فحص الاتصال مع Best Route بنجاح؛ جميع الأنظمة تعمل بشكل سليم.");
      } else {
        toast.warning("تم فحص الاتصال مع Best Route؛ توجد بعض البنود غير المكتملة.");
      }
    } catch {
      setResult(null);
      toast.error("تعذر الاتصال بـ Best Route. تحقق من مفتاح API وإعدادات الشبكة.");
    } finally {
      setPending(false);
    }
  }


  return (
    <section className={s.bestRouteCheck} aria-labelledby="best-route-heading">
      <div className={s.bestRouteHeading}>
        <div><h2 id="best-route-heading">Best Route</h2><p>فحص قراءة فقط للمناطق والحالات وأنواع الطلبات.</p></div>
        <button type="button" className={s.btnGhost} onClick={() => void check()} disabled={pending} aria-busy={pending}>
          {pending ? <span className={s.actionPending}><Spinner /> جارٍ الفحص…</span> : "فحص الاتصال"}
        </button>
      </div>
      {result && <>
        <div className={s.bestRouteResults}>
          {labels.map(({ key, label }) => {
            const item = result[key];
            return <div className={s.bestRouteResult} key={key}>
              <span>{label}</span>
              <b className={item.ok ? s.bestRouteOk : s.bestRouteFail}>
                {item.ok ? `${item.count} نتيجة` : "تعذر"}
              </b>
              {!item.ok && <small role="status">{item.error}</small>}
              {key === "orderTypes" && "choices" in item && item.choices && item.choices.length > 0 &&
                <small>المعرّفات: {item.choices.map((choice) => `${choice.id} — ${choice.name}`).join("، ")}</small>}
            </div>;
          })}
        </div>
        <small className={s.bestRouteChecked}>آخر فحص: {new Date(result.checkedAt).toLocaleString("ar")}</small>
      </>}
    </section>
  );
}
