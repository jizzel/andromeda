import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/admin-session";

// Everything under /admin and /api/admin needs a session, except signing in.
const ADMIN_PUBLIC_PATHS = ["/admin/login", "/api/admin/login/request", "/api/admin/login/verify"];

function adminGuard(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");
  if ((!isAdminPage && !isAdminApi) || ADMIN_PUBLIC_PATHS.includes(pathname)) return null;
  if (isValidSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) return null;

  if (isAdminApi) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export function proxy(request: NextRequest) {
  const denied = adminGuard(request);
  if (denied) return denied;

  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = Buffer.from(nonceBytes).toString("base64");

  const isDev = process.env.NODE_ENV !== "production";
  const devScriptSrc = isDev ? " 'unsafe-eval'" : "";

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'${devScriptSrc} https://assets.calendly.com https://va.vercel-scripts.com https://vercel.live`,
    `style-src 'self' 'unsafe-inline' https://assets.calendly.com https://vercel.live`,
    `img-src 'self' data: blob: https://attakorah.com https://images.unsplash.com https://res.cloudinary.com https://lh3.googleusercontent.com https://*.calendly.com https://vercel.live https://vercel.com`,
    `font-src 'self' data: https://vercel.live https://assets.vercel.com`,
    `connect-src 'self' https://calendly.com https://*.calendly.com https://va.vercel-scripts.com https://vercel.live wss://ws-us3.pusher.com`,
    `frame-src https://calendly.com https://vercel.live`,
    `frame-ancestors 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
