import s from "./LoadingState.module.css";

export function Spinner({ size = "small" }: { size?: "small" | "large" }) {
  return <span className={`${s.spinner} ${size === "large" ? s.large : ""}`} aria-hidden="true" />;
}

export function LoadingScreen({ label = "جارٍ تجهيز الصفحة وتحميل البيانات…", fullPage = false }: { label?: string; fullPage?: boolean }) {
  return (
    <div className={`${s.screen} ${fullPage ? s.fullPage : ""}`} role="status" aria-live="polite">
      <Spinner size="large" />
      <p>{label}</p>
      <span className={s.progress} aria-hidden="true"><span /></span>
    </div>
  );
}
