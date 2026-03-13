import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifyAuthToken } from "@/lib/auth/token";

const PUBLIC_PATHS = new Set([
  "/login",
  "/setup",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/setup",
  "/api/webhooks/ringcentral",
]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/ui-variants/") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$/.test(pathname)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isStaticAsset(pathname) || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? await verifyAuthToken(token) : null;

  if (pathname.startsWith("/api/")) {
    if (!payload) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
