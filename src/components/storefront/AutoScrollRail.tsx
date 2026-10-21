"use client";
import { useEffect, useRef, useState } from "react";
import s from "./storefront.module.css";

export function AutoScrollRail({ children, label, direction = "rtl" }: { children: React.ReactNode; label: string; direction?: "rtl" | "ltr" }) {
  const viewport = useRef<HTMLDivElement>(null);
  const clone = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const resumeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (clone.current) clone.current.inert = true;
    return () => {
      if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    };
  }, []);

  function startDrag() {
    if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    setDragging(true);
  }

  function endDrag() {
    if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setDragging(false), 900);
  }

  return (
    <section className={`${s.rail} ${dragging ? s.railDragging : ""}`} aria-label={label}>
      <div className={s.railViewport} ref={viewport} dir="ltr" onPointerDown={startDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className={s.railTrack}>
          <div className={s.railGroup} dir={direction}>{children}</div>
          <div className={s.railGroup} dir={direction} aria-hidden="true" ref={clone}>{children}</div>
        </div>
      </div>
    </section>
  );
}
