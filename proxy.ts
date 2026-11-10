import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, defaultLocale, hasLocale } from "@/lib/i18n/config";

/**
 * Adds a locale prefix to URLs that don't have one, e.g. `/` -> `/en` or
 * `/plan` -> `/fi/plan`. The learner's last choice (cookie set by the
 * language switcher) wins; otherwise English is used.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];
  if (hasLocale(first)) return;

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(cookie) ? cookie : defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next.js internals, self-hosted runtimes and any path with a file extension.
  matcher: ["/((?!_next|vendor|api|.*\\..*).*)"],
};
