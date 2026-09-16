import { NextRequest, NextResponse } from "next/server";
import { COOKIE_KEYS, ROUTES } from "@/config/constants";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  const isDashboardRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/customers") ||
    request.nextUrl.pathname.startsWith("/workers") ||
    request.nextUrl.pathname.startsWith("/services") ||
    request.nextUrl.pathname.startsWith("/bookings") ||
    request.nextUrl.pathname.startsWith("/vouchers") ||
    request.nextUrl.pathname.startsWith("/reports");

  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/workers/:path*",
    "/services/:path*",
    "/bookings/:path*",
    "/vouchers/:path*",
    "/reports/:path*",
  ],
};
