import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "60vh", display: "grid", placeItems: "center", textAlign: "center", gap: 12, padding: 24 }}>
      <div>
        <h1>الصفحة غير موجودة</h1>
        <p style={{ color: "var(--muted)", margin: "8px 0 16px" }}>قد يكون الرابط خاطئاً أو أن المنتج لم يعد متوفراً.</p>
        <Link href="/ar" style={{ color: "var(--teal)", fontWeight: 700 }}>العودة للرئيسية</Link>
      </div>
    </main>
  );
}
