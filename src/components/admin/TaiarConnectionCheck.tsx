"use client";
import { useState } from "react";
import { checkTaiarConnectionAction } from "@/app/(admin)/admin/actions";
import { Spinner } from "@/components/ui/LoadingState";
import { toast } from "@/components/ui/Toast";
import s from "./admin.module.css";

type CheckResult =
  | { ok: true; citiesCount: number; senderId: string; checkedAt: string }
  | { ok: false; error: string; checkedAt: string };

export function TaiarConnectionCheck() {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [pending, setPending] = useState(false);

  async function check() {
    if (pending) return;
    setPending(true);
    try {
      const data = await checkTaiarConnectionAction();
      const now = new Date().toISOString();
      if (data.ok) {
        setResult({ ok: true, citiesCount: data.citiesCount, senderId: data.senderId, checkedAt: now });
        toast.success(`تم الاتصال بشركة طيار (Taiar) بنجاح (${data.citiesCount} مدينة متاحة).`);
      } else {
        setResult({ ok: false, error: data.error, checkedAt: now });
        toast.error(`تعذر الاتصال بـ طيار: ${data.error}`);
      }
    } catch {
      setResult({ ok: false, error: "تعذر الاتصال بخادم طيار.", checkedAt: new Date().toISOString() });
      toast.error("تعذر الاتصال بـ طيار. تحقق من إعدادات الشبكة ومفتاح API.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={s.bestRouteCheck} aria-labelledby="taiar-check-heading">
      <div className={s.bestRouteHeading}>
        <div>
          <h2 id="taiar-check-heading">شركة الشحن: طيار (Taiar)</h2>
          <p>فحص اتصال مباشر مع خوادم شركة طيار والتحقق من صلاحية الحساب والمدن المتاحة.</p>
        </div>
        <button
          type="button"
          className={s.btnGhost}
          onClick={() => void check()}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? (
            <span className={s.actionPending}>
              <Spinner /> جارٍ الفحص…
            </span>
          ) : (
            "فحص الاتصال"
          )}
        </button>
      </div>

      {result && (
        <>
          <div className={s.bestRouteResults}>
            <div className={s.bestRouteResult}>
              <span>حالة الاتصال</span>
              <b className={result.ok ? s.bestRouteOk : s.bestRouteFail}>
                {result.ok ? "متصل بنجاح" : "تعذر الاتصال"}
              </b>
              {!result.ok && <small role="status">{result.error}</small>}
            </div>

            {result.ok && (
              <>
                <div className={s.bestRouteResult}>
                  <span>قائمة المدن المتاحة</span>
                  <b className={s.bestRouteOk}>{result.citiesCount} مدينة</b>
                </div>

                <div className={s.bestRouteResult}>
                  <span>معرّف المتجر (Sender ID)</span>
                  <b>{result.senderId || "مضبوط"}</b>
                </div>
              </>
            )}
          </div>
          <small className={s.bestRouteChecked}>
            آخر فحص: {new Date(result.checkedAt).toLocaleString("ar")}
          </small>
        </>
      )}
    </section>
  );
}
