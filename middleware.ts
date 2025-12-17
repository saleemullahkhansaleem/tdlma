import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for authentication and route protection
 * 
 * Note: Turbopack may show a deprecation warning about "middleware" file convention.
 * This is a known Turbopack warning and can be safely ignored. The middleware.ts file
 * is still the standard and correct approach in Next.js 16. The functionality works
 * correctly despite the warning.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get("tdlma_auth_token");

  // Parse user from cookie if exists
  let user: { role: string } | null = null;
  if (authCookie) {
    try {
      user = JSON.parse(authCookie.value);
    } catch {
      // Invalid cookie, ignore
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/forgot-password", "/reset-password"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If accessing a protected route without auth
  if (!isPublicRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login page while authenticated, redirect based on role
  if (isPublicRoute && user) {
    if (user.role === "admin" || user.role === "super_admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/user/dashboard", request.url));
    }
  }

  // Protect admin routes - only admin and super_admin can access
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.redirect(new URL("/user/dashboard", request.url));
    }
  }

  // Protect user routes - regular users only (admins should not access)
  if (pathname.startsWith("/user")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role === "admin" || user.role === "super_admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  // Root path redirects
  if (pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user.role === "admin" || user.role === "super_admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/user/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)).*)",
  ],
};
