import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Protected routes that require authentication
const protectedRoutes = ["/chat", "/api/chat"];
// Auth routes (login, etc.)
const authRoutes = ["/login"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to chat if already logged in and accessing auth routes
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/chat", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all paths except static files and api/auth
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks).*)",
  ],
};
