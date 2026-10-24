import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "@/styles/globals.css";
import { isLocale, localeDirection } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/Toast";
import { NavigationProgress } from "@/components/ui/NavigationProgress";

const font = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-ar", display: "swap" });

export const metadata: Metadata = { title: "RAWNQ | رونق", description: "أدوات منزلية بلمسة جمال وجودة" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const requestedLocale = headers().get("x-site-locale") ?? "ar";
  const locale = isLocale(requestedLocale) ? requestedLocale : "ar";
  return (
    <html lang={locale} dir={localeDirection(locale)} className={font.variable}>
      <body>
        <Suspense fallback={null}>
          <ToastProvider>
            <NavigationProgress />
            {children}
          </ToastProvider>
        </Suspense>
      </body>
    </html>
  );
}

