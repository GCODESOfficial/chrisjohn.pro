// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login + static
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Protect /admin
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const hasSession = req.cookies.get("admin_session")?.value;
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      const search = req.nextUrl.search; // keeps ?query if any
      url.searchParams.set("next", pathname + (search || ""));
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Be explicit so the bare /admin is also matched
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
