import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/admin-session";

/**
 * Request-level admin checks. `proxy.ts` already gates /admin and /api/admin;
 * every admin page and route handler checks again here so the proxy is never
 * the only line of defence.
 */

/** For server components under /admin. Redirects to sign-in without a valid session. */
export async function requireAdminPage(): Promise<void> {
  const store = await cookies();
  if (!isValidSessionToken(store.get(ADMIN_SESSION_COOKIE)?.value)) redirect("/admin/login");
}

export function isAdminRequest(request: NextRequest): boolean {
  return isValidSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

/**
 * CSRF guard for state-changing admin requests: the browser-sent Origin must
 * be this site. (Cookies are also SameSite=Strict; this is the second layer.)
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}

export function requestMeta(request: NextRequest): { ip: string; userAgent: string } {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || request.headers.get("x-real-ip") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  };
}

// Per-instance sliding-window throttle. Not a global limit (instances don't
// share memory) — it blunts bursts; the AdminSignIns ledger enforces the
// real per-code attempt cap.
const hits = new Map<string, number[]>();

export function throttle(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
