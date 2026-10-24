import React from "react";
import s from "./Skeleton.module.css";

export function Skeleton({
  width,
  height,
  borderRadius,
  className = "",
  style,
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`${s.shimmer} ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className={s.productCard} aria-hidden="true">
      <Skeleton className={s.productThumb} />
      <Skeleton className={s.productTitle} />
      <Skeleton className={s.productPrice} />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={s.productGrid} aria-label="جارٍ تحميل المنتجات…">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryRailSkeleton() {
  return (
    <div className={s.railSkeleton} aria-hidden="true">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={s.railItem}>
          <Skeleton className={s.railCircle} />
          <Skeleton className={s.railLabel} />
        </div>
      ))}
    </div>
  );
}

// 1. Storefront Home Loading Skeleton
export function StoreHomeSkeleton() {
  return (
    <div className={s.container} aria-label="جارٍ تحميل الصفحة الرئيسية…">
      <Skeleton className={s.bannerSkeleton} />
      <div className={s.headingRow}>
        <Skeleton className={s.headingTitle} />
        <Skeleton className={s.headingLink} />
      </div>
      <CategoryRailSkeleton />

      <div className={s.headingRow} style={{ marginTop: 24 }}>
        <Skeleton className={s.headingTitle} />
        <Skeleton className={s.headingLink} />
      </div>
      <ProductGridSkeleton count={4} />

      <div className={s.headingRow} style={{ marginTop: 40 }}>
        <Skeleton className={s.headingTitle} />
        <Skeleton className={s.headingLink} />
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  );
}

// 2. Storefront Products Catalog Loading Skeleton
export function StoreProductsSkeleton() {
  return (
    <div className={s.container} aria-label="جارٍ تحميل قائمة المنتجات…">
      <Skeleton width="220px" height="34px" style={{ marginBottom: 20 }} />
      <Skeleton width="100%" height="44px" borderRadius="6px" style={{ marginBottom: 24 }} />
      <ProductGridSkeleton count={12} />
    </div>
  );
}

// 3. Storefront Product Detail Loading Skeleton
export function StoreProductDetailSkeleton() {
  return (
    <div className={s.container} aria-label="جارٍ تحميل تفاصيل المنتج…">
      <Skeleton width="120px" height="20px" style={{ marginBottom: 20 }} />
      <div className={s.detailGrid}>
        <Skeleton className={s.detailImage} />
        <div className={s.detailInfo}>
          <Skeleton className={s.detailTitle} />
          <Skeleton className={s.detailPrice} />
          <Skeleton className={s.detailDesc} />
          <div style={{ marginTop: 12 }}>
            <Skeleton width="80px" height="18px" style={{ marginBottom: 8 }} />
            <div className={s.detailOptions}>
              <Skeleton className={s.detailChip} />
              <Skeleton className={s.detailChip} />
              <Skeleton className={s.detailChip} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Skeleton width="80px" height="18px" style={{ marginBottom: 8 }} />
            <div className={s.detailOptions}>
              <Skeleton className={s.detailChip} />
              <Skeleton className={s.detailChip} />
            </div>
          </div>
          <Skeleton className={s.detailButton} />
        </div>
      </div>
    </div>
  );
}

// 4. Storefront Category Loading Skeleton
export function StoreCategorySkeleton() {
  return (
    <div className={s.container} aria-label="جارٍ تحميل القسم…">
      <CategoryRailSkeleton />
      <Skeleton width="240px" height="32px" style={{ margin: "24px 0" }} />
      <ProductGridSkeleton count={8} />
    </div>
  );
}

// 5. Storefront Cart Loading Skeleton
export function StoreCartSkeleton() {
  return (
    <div className={s.container} aria-label="جارٍ تحميل سلة التسوق…">
      <Skeleton width="180px" height="32px" style={{ marginBottom: 24 }} />
      <div className={s.cartLayout}>
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={s.cartItem}>
              <Skeleton className={s.cartItemThumb} />
              <div className={s.cartItemContent}>
                <Skeleton width="60%" height="20px" />
                <Skeleton width="30%" height="16px" />
                <Skeleton width="40%" height="16px" />
              </div>
            </div>
          ))}
        </div>
        <div className={s.summaryCard}>
          <Skeleton width="120px" height="24px" />
          <Skeleton width="100%" height="16px" />
          <Skeleton width="100%" height="16px" />
          <Skeleton width="100%" height="22px" style={{ marginTop: 8 }} />
          <Skeleton width="100%" height="46px" borderRadius="6px" style={{ marginTop: 12 }} />
        </div>
      </div>
    </div>
  );
}

// 6. Storefront Checkout Loading Skeleton
export function StoreCheckoutSkeleton() {
  return (
    <div className={s.container} aria-label="جارٍ تحميل صفحة إتمام الطلب…">
      <Skeleton width="200px" height="32px" style={{ marginBottom: 12 }} />
      <Skeleton width="280px" height="18px" style={{ marginBottom: 28 }} />
      <div className={s.cartLayout}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className={s.summaryCard}>
            <Skeleton width="160px" height="24px" style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height="42px" borderRadius="6px" />
            <Skeleton width="100%" height="42px" borderRadius="6px" />
            <Skeleton width="100%" height="42px" borderRadius="6px" />
            <Skeleton width="100%" height="80px" borderRadius="6px" />
          </div>
          <div className={s.summaryCard}>
            <Skeleton width="160px" height="24px" style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height="60px" borderRadius="6px" />
          </div>
        </div>
        <div className={s.summaryCard}>
          <Skeleton width="140px" height="24px" style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height="18px" />
          <Skeleton width="100%" height="18px" />
          <Skeleton width="100%" height="18px" />
          <Skeleton width="100%" height="48px" borderRadius="6px" style={{ marginTop: 16 }} />
        </div>
      </div>
    </div>
  );
}

// 7. Storefront Orders List Skeleton
export function StoreOrdersSkeleton() {
  return (
    <div className={s.container} aria-label="جارٍ تحميل الطلبات…">
      <Skeleton width="180px" height="32px" style={{ marginBottom: 24 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={s.orderRow}>
          <Skeleton className={s.orderRowThumb} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton width="140px" height="20px" />
            <Skeleton width="90px" height="14px" />
            <Skeleton width="120px" height="16px" />
          </div>
          <Skeleton width="80px" height="28px" borderRadius="4px" />
        </div>
      ))}
    </div>
  );
}

// 8. Storefront Order Detail Skeleton
export function StoreOrderDetailSkeleton() {
  return (
    <div className={s.container} aria-label="جارٍ تحميل تفاصيل الطلب…">
      <Skeleton width="220px" height="32px" style={{ marginBottom: 16 }} />
      <Skeleton width="160px" height="18px" style={{ marginBottom: 28 }} />
      <Skeleton width="100%" height="64px" borderRadius="8px" style={{ marginBottom: 24 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={s.orderRow}>
            <Skeleton className={s.orderRowThumb} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <Skeleton width="160px" height="18px" />
              <Skeleton width="100px" height="14px" />
            </div>
            <Skeleton width="70px" height="18px" />
          </div>
        ))}
      </div>
      <div className={s.summaryCard}>
        <Skeleton width="100%" height="18px" />
        <Skeleton width="100%" height="18px" />
        <Skeleton width="100%" height="24px" style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}

// 9. Storefront Profile Skeleton
export function StoreProfileSkeleton() {
  return (
    <div className={s.container} aria-label="جارٍ تحميل الملف الشخصي…">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <Skeleton width="64px" height="64px" borderRadius="50%" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width="160px" height="24px" />
          <Skeleton width="120px" height="16px" />
        </div>
      </div>
      <div className={s.summaryCard} style={{ maxWidth: 640 }}>
        <Skeleton width="140px" height="24px" style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height="42px" borderRadius="6px" />
        <Skeleton width="100%" height="42px" borderRadius="6px" />
        <Skeleton width="100%" height="42px" borderRadius="6px" />
        <Skeleton width="100%" height="80px" borderRadius="6px" />
        <Skeleton width="140px" height="42px" borderRadius="6px" style={{ marginTop: 12 }} />
      </div>
    </div>
  );
}

// 10. Storefront Auth Skeleton
export function StoreAuthSkeleton() {
  return (
    <div className={s.container} aria-label="جارٍ التحميل…">
      <div className={s.authCard}>
        <Skeleton width="160px" height="30px" style={{ alignSelf: "center", marginBottom: 8 }} />
        <Skeleton width="100%" height="42px" borderRadius="6px" />
        <Skeleton width="100%" height="42px" borderRadius="6px" />
        <Skeleton width="100%" height="44px" borderRadius="6px" style={{ marginTop: 8 }} />
        <Skeleton width="180px" height="16px" style={{ alignSelf: "center", marginTop: 4 }} />
      </div>
    </div>
  );
}

// 11. Admin Dashboard Skeleton
export function AdminDashboardSkeleton() {
  return (
    <div style={{ padding: "8px 0" }} aria-label="جارٍ تحميل لوحة التحكم…">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width="80px" height="16px" />
          <Skeleton width="180px" height="32px" />
        </div>
        <Skeleton width="120px" height="38px" borderRadius="6px" />
      </div>

      <div className={s.adminStats}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={s.adminStatCard}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Skeleton width="70px" height="16px" />
              <Skeleton width="32px" height="32px" borderRadius="6px" />
            </div>
            <Skeleton width="90px" height="34px" />
            <Skeleton width="120px" height="14px" />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", margin: "24px 0 16px" }}>
        <Skeleton width="140px" height="24px" />
        <Skeleton width="100px" height="20px" />
      </div>

      <AdminTableSkeleton rows={4} />
    </div>
  );
}

// 12. Admin Table Skeleton
export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={s.adminTable} aria-label="جارٍ تحميل البيانات…">
      <div className={s.adminTableRow} style={{ background: "#f8faf8" }}>
        <Skeleton width="180px" height="18px" />
        <Skeleton width="120px" height="18px" />
        <Skeleton width="80px" height="18px" />
        <Skeleton width="100px" height="18px" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={s.adminTableRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Skeleton width="40px" height="40px" borderRadius="6px" />
            <Skeleton width="140px" height="18px" />
          </div>
          <Skeleton width="80px" height="18px" />
          <Skeleton width="60px" height="24px" borderRadius="4px" />
          <div style={{ display: "flex", gap: 8 }}>
            <Skeleton width="50px" height="30px" borderRadius="4px" />
            <Skeleton width="50px" height="30px" borderRadius="4px" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 13. Admin Form Skeleton
export function AdminFormSkeleton() {
  return (
    <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 20 }} aria-label="جارٍ تحميل النموذج…">
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        <Skeleton width="100px" height="16px" />
        <Skeleton width="220px" height="32px" />
      </div>
      <Skeleton width="100%" height="42px" borderRadius="6px" />
      <Skeleton width="100%" height="90px" borderRadius="6px" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Skeleton width="100%" height="42px" borderRadius="6px" />
        <Skeleton width="100%" height="42px" borderRadius="6px" />
      </div>
      <Skeleton width="100%" height="160px" borderRadius="6px" />
      <Skeleton width="140px" height="42px" borderRadius="6px" style={{ marginTop: 8 }} />
    </div>
  );
}

// 14. Admin Order Detail Skeleton
export function AdminOrderDetailSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} aria-label="جارٍ تحميل تفاصيل الطلب…">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Skeleton width="90px" height="16px" />
          <Skeleton width="180px" height="30px" />
        </div>
        <Skeleton width="120px" height="36px" borderRadius="6px" />
      </div>
      <Skeleton width="100%" height="64px" borderRadius="8px" />
      <AdminTableSkeleton rows={3} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 500 }}>
        <Skeleton width="100%" height="24px" />
        <Skeleton width="100%" height="24px" />
        <Skeleton width="100%" height="30px" />
      </div>
    </div>
  );
}
