"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, MessageCircle } from "lucide-react";
import type { OrderListRow } from "@/lib/data/admin";
import { STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { formatPrice } from "@/lib/format";
import { StatusSelect, ConfirmButton } from "@/components/admin/Controls";
import { deleteOrderAction } from "@/app/(admin)/admin/actions";
import { WhatsAppCustomerButton } from "@/components/admin/OrderCustomerActions";
import s from "./admin.module.css";

const STATUS_KEYS: OrderStatus[] = ["NEW", "PROCESSING", "SHIPPED", "DONE", "CANCELLED"];

export function OrdersTableFilter({ initialOrders }: { initialOrders: OrderListRow[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Calculate status counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: initialOrders.length };
    for (const key of STATUS_KEYS) {
      c[key] = 0;
    }
    for (const o of initialOrders) {
      if (c[o.status] !== undefined) {
        c[o.status]++;
      }
    }
    return c;
  }, [initialOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return initialOrders.filter((o) => {
      // Status filter
      if (selectedStatus !== "ALL" && o.status !== selectedStatus) {
        return false;
      }
      // Search term filter
      if (term) {
        const matchNumber = o.orderNumber.toLowerCase().includes(term);
        const matchCustomer = o.customerName.toLowerCase().includes(term);
        const matchPhone = o.phone ? o.phone.replace(/[^\d]/g, "").includes(term.replace(/[^\d]/g, "")) : false;
        const matchCity = o.city ? o.city.toLowerCase().includes(term) : false;
        if (!matchNumber && !matchCustomer && !matchPhone && !matchCity) {
          return false;
        }
      }
      return true;
    });
  }, [initialOrders, searchTerm, selectedStatus]);

  return (
    <>
      <div className={s.ordersFilterWrap}>
        <div className={s.ordersFilterTop}>
          <div className={s.filterSearchBox}>
            <Search size={16} className={s.filterSearchIcon} aria-hidden="true" />
            <input
              type="text"
              className={s.filterSearchInput}
              placeholder="ابحث برقم الطلب، اسم العميل، الهاتف أو المدينة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="مسح البحث"
                style={{
                  position: "absolute",
                  insetInlineEnd: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  color: "var(--a-muted)",
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        <div className={s.filterStatusTabs}>
          <button
            type="button"
            className={`${s.filterStatusBtn} ${selectedStatus === "ALL" ? s.filterStatusBtnActive : ""}`}
            onClick={() => setSelectedStatus("ALL")}
          >
            <span>الكل</span>
            <span className={s.filterCountBadge}>{counts.ALL ?? 0}</span>
          </button>
          {STATUS_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={`${s.filterStatusBtn} ${selectedStatus === k ? s.filterStatusBtnActive : ""}`}
              onClick={() => setSelectedStatus(k)}
            >
              <span>{STATUS_LABEL[k]}</span>
              <span className={s.filterCountBadge}>{counts[k] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className={s.emptyState}>
          <p>لا توجد طلبات مطابقة لخيارات البحث والفلترة.</p>
          {(searchTerm || selectedStatus !== "ALL") && (
            <button
              type="button"
              className={s.btnGhost}
              style={{ marginTop: "12px" }}
              onClick={() => {
                setSearchTerm("");
                setSelectedStatus("ALL");
              }}
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>العميل</th>
                <th>الهاتف / التواصل</th>
                <th>المدينة</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.orderNumber}>
                  <td>
                    <div className={s.itemCell}>
                      <Image className={s.thumb} src={o.image} alt="" width={42} height={42} />
                      <div>
                        <b>{o.orderNumber}</b>
                        {o.createdAt && (
                          <small>{new Date(o.createdAt).toLocaleDateString("ar-EG")}</small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td><b>{o.customerName}</b></td>
                  <td>
                    {o.phone ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span dir="ltr" style={{ fontSize: "0.82rem" }}>{o.phone}</span>
                        <WhatsAppCustomerButton
                          phone={o.phone}
                          customerName={o.customerName}
                          orderNumber={o.orderNumber}
                          total={o.total}
                          label="واتساب"
                          size="sm"
                        />
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{o.city || "—"}</td>
                  <td><b>{formatPrice(o.total)}</b></td>
                  <td><StatusSelect orderNumber={o.orderNumber} status={o.status} /></td>
                  <td>
                    <div className={s.cellActions}>
                      <Link href={`/admin/orders/${o.orderNumber}`} className={s.sm}>
                        فتح الطلب
                      </Link>
                      <form action={deleteOrderAction}>
                        <input type="hidden" name="orderNumber" value={o.orderNumber} />
                        <ConfirmButton
                          className={`${s.sm} ${s.danger}`}
                          message={`هل أنت متأكد من حذف الطلب رقم ${o.orderNumber} نهائياً؟`}
                        >
                          حذف
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
