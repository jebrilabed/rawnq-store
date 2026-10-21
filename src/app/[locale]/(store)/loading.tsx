import { LoadingScreen } from "@/components/ui/LoadingState";
import { translate } from "@/lib/i18n";
import { headers } from "next/headers";

export default function StoreLoading() {
  const locale = headers().get("x-site-locale") ?? "ar";
  return <LoadingScreen label={translate(locale, "جارٍ تجهيز الصفحة وتحميل بيانات المتجر…")} />;
}
