import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = Buffer.from(nonceBytes).toString("base64");

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://assets.calendly.com https://va.vercel-scripts.com https://vercel.live`,
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
