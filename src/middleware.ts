import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip exploit header (CVE-2025-29927)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-middleware-subrequest");

  // Public routes that don't need auth
  const publicPaths = ["/login", "/api/lb/auth/login", "/api/lb/auth/register"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  if (isPublic) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Protect all app routes — require session cookie
  const sessionToken = request.cookies.get("lb-session")?.value;

  // Protect pages
  if (!pathname.startsWith("/api/") && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect API routes (except public ones)
  if (pathname.startsWith("/api/") && !sessionToken) {
    // Allow customer API without auth for initial setup
    if (pathname.startsWith("/api/customers")) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
