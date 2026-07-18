import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = ["/auth/login", "/auth/register"];

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // API routes: never run i18n middleware on them
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/fonts") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const response = intlMiddleware(request);

  const localeMatch = pathname.match(/^\/(fa|en)(\/.*)?$/);
  const localePath = localeMatch ? localeMatch[2] || "/" : pathname;

  const isPublicPath = PUBLIC_PATHS.some((p) => localePath.startsWith(p));

  if (!isPublicPath && localePath !== "/") {
    const sessionToken = request.cookies.get("noorai_session")?.value;

    if (!sessionToken) {
      const locale = localeMatch ? localeMatch[1] : "fa";
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
