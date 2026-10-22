import { STATUS_LABEL, type OrderStatus, type OrderStatusHistoryEntry } from "@/lib/orders";
import { translate } from "@/lib/i18n";
import s from "./OrderStatusTracking.module.css";

export function OrderStatusTracking({ status, history = [], locale }: {
  status: OrderStatus;
  history?: OrderStatusHistoryEntry[];
  locale: string;
}) {
  const tr = (text: string) => translate(locale, text);
  const entries = history.length ? history : [{ status, createdAt: "" }];

  return (
    <section className={s.tracking} aria-labelledby="order-tracking-title">
      <h2 id="order-tracking-title">{tr("تتبع حالة الطلب")}</h2>
      <ol className={s.timeline}>
        {entries.map((entry, index) => (
          <li key={`${entry.status}-${entry.createdAt}-${index}`} className={s.event} data-current={index === entries.length - 1}>
            <span className={s.marker} aria-hidden="true" />
            <div className={s.eventBody}>
              <b>{tr(STATUS_LABEL[entry.status])}</b>
              {entry.createdAt && <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString(locale)}</time>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
