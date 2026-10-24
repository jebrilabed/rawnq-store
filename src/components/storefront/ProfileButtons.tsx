"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { Spinner } from "@/components/ui/LoadingState";
import { translate } from "@/lib/i18n";
import s from "./storefront.module.css";

export function ProfileSubmitButton({ locale }: { locale: string }) {
  const { pending } = useFormStatus();
  const tr = (text: string) => translate(locale, text);

  return (
    <button
      type="submit"
      className={s.btn}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <span className={s.pendingAction}>
          <Spinner /> {tr("جارٍ حفظ البيانات…")}
        </span>
      ) : (
        tr("حفظ البيانات")
      )}
    </button>
  );
}

export function ProfileLogoutButton({ locale }: { locale: string }) {
  const { pending } = useFormStatus();
  const tr = (text: string) => translate(locale, text);

  return (
    <button
      type="submit"
      className={s.profileLogout}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <span className={s.pendingAction}>
          <Spinner /> {tr("جارٍ تسجيل الخروج…")}
        </span>
      ) : (
        <>
          <LogOut size={18} aria-hidden="true" />
          {tr("تسجيل الخروج")}
        </>
      )}
    </button>
  );
}
