// middleware.ts (at project root)
import { NextRequest, NextResponse } from "next/server";

// Public routes that don't require auth
const PUBLIC_ROUTES = ["/login", "/register", "/admin/login"];
const ADMIN_ROUTES = ["/admin"];
const USER_ROUTES = ["/dashboard", "/profile", "/deposits", "/withdrawals", "/team", "/rewards", "/history"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("tradion_token")?.value;

  // Allow public API routes
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Public pages — redirect to dashboard if already logged in
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    if (token) {
      // Let the page handle the redirect based on role
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  // Protected user routes
  if (USER_ROUTES.some(r => pathname.startsWith(r))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Protected admin routes
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r)) && !pathname.startsWith("/admin/login")) {
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Protected API routes
  if (pathname.startsWith("/api/user") || pathname.startsWith("/api/signals") ||
      pathname.startsWith("/api/deposits") || pathname.startsWith("/api/withdrawals")) {
    if (!token) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
