import type { NextConfig } from "next";

// The client hub (/proposal/[id]) can only be entered through a session, so a
// deployment without CLIENT_SESSION_SECRET would lock every client out of their
// proposal even with the right access code. Fail Vercel builds loudly instead
// of shipping that; locally, just warn so development isn't blocked.
if (!process.env.CLIENT_SESSION_SECRET) {
  const message =
    "CLIENT_SESSION_SECRET is not set: clients can't open proposals (the hub's access-code sign-in needs it). " +
    "Add it to the Vercel project (Production and Preview) — e.g. `openssl rand -hex 32`.";
  if (process.env.VERCEL) throw new Error(message);
  console.warn(`⚠ ${message}`);
}

const nextConfig: NextConfig = {
  // Headless Chromium for the proposal PDF export (lib/pdf.ts): keep these out of
  // the bundle, and make sure the compressed Chromium binary ships with the route.
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  // Every route that renders PDFs runs as its own function on Vercel, so each
  // needs the binary: the client export (/api/proposal/pdf) and the admin
  // export (/api/admin/proposals/[id]/pdf). A glob, because `[id]` would be
  // read as a character class.
  outputFileTracingIncludes: {
    '/api/**/pdf': ['./node_modules/@sparticuz/chromium/bin/**'],
    // These render the executed-agreement PDF too: the client's signature (after
    // the response, to email it) and the admin "Resend executed copy".
    '/api/proposal/agreement/sign': ['./node_modules/@sparticuz/chromium/bin/**', './content/agreements/**'],
    '/api/**/agreement/executed-copy': ['./node_modules/@sparticuz/chromium/bin/**'],
    // Agreement terms are read from the repo at request time (lib/agreement-templates.ts).
    '/api/admin/proposals/**': ['./content/agreements/**'],
    '/admin/proposals/**': ['./content/agreements/**'],
    // The dashboard flags agreements whose terms file changed (lib/admin-dashboard.ts).
    '/admin': ['./content/agreements/**'],
    '/api/proposal/**': ['./content/agreements/**'],
    '/proposal/**': ['./content/agreements/**'],
  },
  async redirects() {
    return [
      {
        source: '/writing',
        destination: '/perspective',
        permanent: true,
      },
      {
        source: '/writing/:path*',
        destination: '/perspective/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Next 16 only allows quality 75 unless listed; the business card portrait uses 85.
    qualities: [75, 85],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/photo-**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/attakorah/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/gps-cs-s/**',
      }
    ],
  },
};

export default nextConfig;
