"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import s from "./Toast.module.css";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  dismissing?: boolean;
}

type ToastInput = {
  type?: ToastType;
  message: string;
  title?: string;
  duration?: number;
};

// Global Event Bus for Toasts
type ToastListener = (toast: ToastItem) => void;
type DismissListener = (id: string) => void;

class ToastManager {
  private listeners: Set<ToastListener> = new Set();
  private dismissListeners: Set<DismissListener> = new Set();

  subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeDismiss(listener: DismissListener) {
    this.dismissListeners.add(listener);
    return () => {
      this.dismissListeners.delete(listener);
    };
  }

  show(input: ToastInput | string, type: ToastType = "info"): string {
    const item: ToastItem = typeof input === "string"
      ? {
          id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type,
          message: input,
          duration: type === "error" ? 6000 : 4000,
        }
      : {
          id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: input.type ?? type,
          message: input.message,
          title: input.title,
          duration: input.duration ?? (input.type === "error" ? 6000 : 4000),
        };

    this.listeners.forEach((listener) => listener(item));
    return item.id;
  }

  dismiss(id: string) {
    this.dismissListeners.forEach((listener) => listener(id));
  }

  success(message: string, title?: string, duration?: number) {
    return this.show({ type: "success", message, title, duration });
  }

  error(message: string, title?: string, duration?: number) {
    return this.show({ type: "error", message, title, duration: duration ?? 6000 });
  }

  warning(message: string, title?: string, duration?: number) {
    return this.show({ type: "warning", message, title, duration });
  }

  info(message: string, title?: string, duration?: number) {
    return this.show({ type: "info", message, title, duration });
  }
}

export const toast = new ToastManager();

interface ToastContextValue {
  showToast: (input: ToastInput | string, type?: ToastType) => string;
  dismissToast: (id: string) => void;
  toast: ToastManager;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (input: ToastInput | string, type?: ToastType) => toast.show(input, type),
      dismissToast: (id: string) => toast.dismiss(id),
      toast,
    };
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) =>
      current.map((t) => (t.id === id ? { ...t, dismissing: true } : t))
    );
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const addToast = useCallback((item: ToastItem) => {
    setToasts((current) => {
      // Prevent exact duplicate active messages
      const isDuplicate = current.some(
        (t) => !t.dismissing && t.message === item.message && t.type === item.type
      );
      if (isDuplicate) return current;
      // Cap at 4 active toasts max
      const active = current.filter((t) => !t.dismissing);
      const next = active.length >= 4 ? active.slice(1) : active;
      return [...next, item];
    });
  }, []);

  useEffect(() => {
    const unsubAdd = toast.subscribe(addToast);
    const unsubDismiss = toast.subscribeDismiss(dismissToast);
    return () => {
      unsubAdd();
      unsubDismiss();
    };
  }, [addToast, dismissToast]);

  const showToast = useCallback(
    (input: ToastInput | string, type: ToastType = "info") => toast.show(input, type),
    []
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, toast }}>
      {children}
      <ToastUrlWatcher />
      <div className={s.container} aria-live="polite" role="region" aria-label="الإشعارات">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [remaining, setRemaining] = useState(item.duration ?? 4000);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPaused) return;

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(item.id);
    }, remaining);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, remaining, item.id, onDismiss]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    setRemaining((prev) => Math.max(prev - elapsed, 500));
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const typeClass = s[item.type] || s.info;

  const defaultTitles: Record<ToastType, string> = {
    success: "تم بنجاح",
    error: "خطأ",
    warning: "تنبيه",
    info: "معلومة",
  };

  const title = item.title || defaultTitles[item.type];

  return (
    <div
      className={`${s.toast} ${typeClass} ${item.dismissing ? s.toastDismissing : ""}`}
      role={item.type === "error" ? "alert" : "status"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={s.iconWrapper}>
        {item.type === "success" && <CheckCircle2 size={18} aria-hidden="true" />}
        {item.type === "error" && <AlertCircle size={18} aria-hidden="true" />}
        {item.type === "warning" && <AlertTriangle size={18} aria-hidden="true" />}
        {item.type === "info" && <Info size={18} aria-hidden="true" />}
      </div>

      <div className={s.content}>
        {title && <span className={s.title}>{title}</span>}
        <span className={s.message}>{item.message}</span>
      </div>

      <button
        type="button"
        className={s.closeButton}
        onClick={() => onDismiss(item.id)}
        aria-label="إغلاق الإشعار"
      >
        <X size={16} aria-hidden="true" />
      </button>

      {item.duration && item.duration > 0 && (
        <div
          className={s.progressBar}
          style={{
            animation: !isPaused
              ? `shrinkWidth ${item.duration}ms linear forwards`
              : "none",
          }}
        />
      )}
    </div>
  );
}

// Watcher for searchParams feedback (e.g., from server action redirects)
function ToastUrlWatcher() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const handledKey = useRef<string>("");

  useEffect(() => {
    if (!searchParams) return;
    const saved = searchParams.get("saved");
    const error = searchParams.get("error");
    const delivery = searchParams.get("delivery");
    const currentKey = `${pathname}?${searchParams.toString()}`;

    if (handledKey.current === currentKey) return;

    let hasHandled = false;

    if (saved) {
      hasHandled = true;
      const message =
        saved === "1"
          ? "تم حفظ التغييرات بنجاح."
          : saved;
      toast.success(message);
    }

    if (error) {
      hasHandled = true;
      const errorMap: Record<string, string> = {
        credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        exists: "يوجد حساب مسجل بهذا البريد الإلكتروني.",
        invalid: "تحقق من جميع البيانات المطلوبة وحاول مرة أخرى.",
      };
      const message = errorMap[error] || decodeURIComponent(error);
      toast.error(message);
    }

    if (delivery === "pending") {
      hasHandled = true;
      toast.warning("تم استلام طلبك وجارٍ معالجة التوصيل مع شركة الشحن.");
    }

    if (hasHandled) {
      handledKey.current = currentKey;
      // Clean up the URL parameters gracefully without reload
      try {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete("saved");
        nextUrl.searchParams.delete("error");
        nextUrl.searchParams.delete("delivery");
        const cleanQuery = nextUrl.searchParams.toString();
        const newUrl = `${nextUrl.pathname}${cleanQuery ? `?${cleanQuery}` : ""}${nextUrl.hash}`;
        window.history.replaceState(null, "", newUrl);
      } catch {
        // ignore if not in browser
      }
    }
  }, [searchParams, pathname]);

  return null;
}
