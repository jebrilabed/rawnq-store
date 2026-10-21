"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LOCALES, LOCALE_NAMES, isLocale } from "@/lib/i18n";
import s from "./storefront.module.css";

export function LanguageSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedLocale = isLocale(locale) ? locale : "ar";

  function focusMenuItem(position: "first" | "last" | "next" | "previous") {
    const items = Array.from(switcherRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
    if (!items.length) return;
    const currentIndex = items.findIndex((item) => item === document.activeElement);
    const index = position === "first"
      ? 0
      : position === "last"
        ? items.length - 1
        : position === "next"
          ? (currentIndex + 1) % items.length
          : (currentIndex - 1 + items.length) % items.length;
    items[index].focus();
  }

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !switcherRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function changeLocale(nextLocale: string) {
    if (!isLocale(nextLocale)) return;
    const localizedPath = (pathname ?? `/${locale}`).replace(/^\/[^/]+(?=\/|$)/, `/${nextLocale}`);
    const query = searchParams.toString();
    router.push(query ? `${localizedPath}?${query}` : localizedPath);
    setOpen(false);
  }

  return (
    <div
      className={s.languageSelect}
      ref={switcherRef}
      onBlur={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <span className={s.visuallyHidden} id="language-switcher-label">Language / اللغة / שפה / Язык</span>
      <button
        ref={triggerRef}
        type="button"
        className={s.languageTrigger}
        aria-label={`Language: ${LOCALE_NAMES[selectedLocale]}`}
        aria-labelledby="language-switcher-label"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) {
              setOpen(true);
              requestAnimationFrame(() => focusMenuItem(event.key === "ArrowDown" ? "first" : "last"));
            } else {
              focusMenuItem(event.key === "ArrowDown" ? "first" : "last");
            }
          }
        }}
      >
        <Globe2 size={17} aria-hidden="true" />
        <span className={s.languageCode}>{selectedLocale.toUpperCase()}</span>
        <ChevronDown className={open ? s.languageChevronOpen : s.languageChevron} size={15} aria-hidden="true" />
      </button>
      {open && (
        <div
          className={s.languageMenu}
          role="menu"
          aria-labelledby="language-switcher-label"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
              event.preventDefault();
              const position = event.key === "ArrowDown" ? "next"
                : event.key === "ArrowUp" ? "previous"
                  : event.key === "Home" ? "first" : "last";
              focusMenuItem(position);
            }
          }}
        >
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              className={`${s.languageOption} ${code === selectedLocale ? s.languageOptionActive : ""}`}
              role="menuitemradio"
              aria-checked={code === selectedLocale}
              dir="ltr"
              onClick={() => changeLocale(code)}
            >
              <span className={s.languageOptionCode}>{code.toUpperCase()}</span>
              <span className={s.languageName} dir="auto">{LOCALE_NAMES[code]}</span>
              {code === selectedLocale && <Check className={s.languageCheck} size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
