import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/lib/i18n";

export function middleware(request: NextRequest) {
  const locale = request.nextUrl.pathname.split("/")[1] ?? "";
  const headers = new Headers(request.headers);
  headers.set("x-site-locale", isLocale(locale) ? locale : "ar");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
