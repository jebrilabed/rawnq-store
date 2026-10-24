"use client";
import { useEffect, useRef, useState } from "react";
import s from "./storefront.module.css";

export function AutoScrollRail({ children, label, direction = "rtl", interactiveClone = true }: { children: React.ReactNode; label: string; direction?: "rtl" | "ltr"; interactiveClone?: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const clone = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ id: number; x: number; scrollLeft: number } | null>(null);
  const dragged = useRef(false);
  const [dragging, setDragging] = useState(false);
  const resumeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (clone.current) {
      clone.current.inert = !interactiveClone;
      if (interactiveClone) {
        clone.current.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [tabindex]").forEach((element) => {
          element.tabIndex = -1;
        });
      }
    }
    return () => {
      if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    };
  }, [interactiveClone]);

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    pointerStart.current = { id: event.pointerId, x: event.clientX, scrollLeft: event.currentTarget.scrollLeft };
    dragged.current = false;
    setDragging(true);
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    if (!start || start.id !== event.pointerId) return;
    const delta = event.clientX - start.x;
    if (Math.abs(delta) > 4 && !dragged.current) {
      dragged.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (dragged.current) {
      event.preventDefault();
      event.currentTarget.scrollLeft = start.scrollLeft - delta;
    }
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerStart.current?.id !== event.pointerId) return;
    pointerStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setDragging(false), 900);
  }

  return (
    <section className={`${s.rail} ${dragging ? s.railDragging : ""}`} aria-label={label}>
      <div
        className={s.railViewport}
        ref={viewport}
        dir="ltr"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => {
          if (dragged.current) {
            event.preventDefault();
            event.stopPropagation();
            dragged.current = false;
          }
        }}
      >
        <div className={s.railTrack}>
          <div className={s.railGroup} dir={direction}>{children}</div>
          <div className={s.railGroup} dir={direction} aria-hidden="true" ref={clone}>{children}</div>
        </div>
      </div>
    </section>
  );
}
