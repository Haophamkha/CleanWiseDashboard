import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ROLE, COOKIE_KEYS, ROUTES } from "@/config/constants";

function readRole(token: string): string | null {
  try {
    const part = token.split(".")[1];
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)).role ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname.startsWith(ROUTES.LOGIN);

  const access = request.cookies.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  const refresh = request.cookies.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;

  if (access && readRole(access) !== ALLOWED_ROLE) {
    const res = isLogin
      ? NextResponse.next()
      : NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    res.cookies.delete(COOKIE_KEYS.ACCESS_TOKEN);
    res.cookies.delete(COOKIE_KEYS.REFRESH_TOKEN);
    return res;
  }

  const hasSession = Boolean(access || refresh);

  if (!hasSession && !isLogin) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }
  if (hasSession && isLogin) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
