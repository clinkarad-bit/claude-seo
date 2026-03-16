import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip exploit header (CVE-2025-29927)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-middleware-subrequest");

  // Protect linkbuilding routes — require session cookie
  if (pathname.startsWith("/linkbuilding")) {
    const sessionToken = request.cookies.get("lb-session")?.value;
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect LB API routes (except login)
  if (
    pathname.startsWith("/api/lb/") &&
    !pathname.startsWith("/api/lb/auth/login")
  ) {
    const sessionToken = request.cookies.get("lb-session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/linkbuilding/:path*", "/api/lb/:path*"],
};
