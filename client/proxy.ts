import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isAdminDashboard = pathname.startsWith(
    "/admin-dashboard"
  );

  const isAuthorDashboard = pathname.startsWith(
    "/author-dashboard"
  );

  const isProtectedRoute =
    isAdminDashboard || isAuthorDashboard;

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("callbackUrl", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin-dashboard/:path*",
    "/author-dashboard/:path*",
  ],
};
