import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

/**
 * Next.js 16 renamed `middleware` to `proxy` (the function is `proxy`, the file
 * is `proxy.ts`). This runs on the Node.js runtime by default in v16.
 *
 * We build a lightweight Auth.js instance from the edge-safe `authConfig` (no
 * Prisma/argon2) purely to read the session JWT, then enforce:
 *   1. unauthenticated users → /login
 *   2. authenticated users on auth pages → their role home
 *   3. role boundaries: owner area blocked for tenants and vice versa
 */
const { auth } = NextAuth(authConfig);

// Public (unauthenticated) routes.
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

// URL prefixes that require a specific role.
const OWNER_PREFIXES = [
  "/dashboard",
  "/properties",
  "/tenants",
  "/reports",
  "/requests",
];
const TENANT_PREFIXES = ["/home", "/property", "/bookings"];

function matchesPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  const isPublic = matchesPrefix(path, PUBLIC_ROUTES);

  // 1. Not logged in → allow public routes, otherwise redirect to /login.
  if (!isLoggedIn) {
    if (isPublic) return NextResponse.next();
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  const roleHome = role === "OWNER" ? "/dashboard" : "/home";

  // 2. Logged in but on an auth page (or root) → bounce to their role home.
  if (isPublic || path === "/") {
    return NextResponse.redirect(new URL(roleHome, nextUrl));
  }

  // 3. Role enforcement.
  if (matchesPrefix(path, OWNER_PREFIXES) && role !== "OWNER") {
    return NextResponse.redirect(new URL("/home", nextUrl));
  }
  if (matchesPrefix(path, TENANT_PREFIXES) && role !== "TENANT") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except the auth & cron APIs (they do their own auth),
  // Next internals, and static assets.
  matcher: [
    "/((?!api/auth|api/cron|api/webhooks|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
