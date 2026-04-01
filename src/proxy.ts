import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  // Public routes
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    if (token && (pathname === "/login" || pathname === "/register")) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL("/book", request.url));
      } catch {
        // Invalid token — let them through to login/register
      }
    }
    return NextResponse.next();
  }

  // All other matched routes require authentication
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    // Admin routes require ADMIN role
    if (pathname.startsWith("/admin")) {
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Invalid token — clear and redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth-token");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
