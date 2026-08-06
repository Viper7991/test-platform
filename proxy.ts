import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page and login API through
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  // Protect both admin pages and admin API routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = req.cookies.get("admin_token")?.value;

    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET as string);
      return NextResponse.next();
    } catch {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  if (pathname.startsWith("/api/user")) {
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    try {
      jwt.verify(token, process.env.JWT_SECRET as string);
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/user/:path*"],
};