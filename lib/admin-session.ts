import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";

/**
 * Single-admin authentication for /admin. Stateless: everything lives in two
 * HMAC-signed cookies keyed with ADMIN_SESSION_SECRET, so there's no session
 * store. Missing secret → every check fails closed.
 *
 * - `admin_otp`: issued when a sign-in code is emailed to Joseph. Holds only a
 *   keyed hash of the code, a nonce and its expiry — never the code. Attempts
 *   and single use are enforced server-side against the nonce by the
 *   append-only `AdminSignIns` log (see `registerAdminSignInAttempt`), because
 *   a client could otherwise replay an earlier cookie to reset its own count.
 * - `admin_session`: issued once the code is verified; 12-hour lifetime.
 *
 * Token format: `<base64url JSON payload>.<base64url HMAC-SHA256 of payload>`.
 * Each payload carries a `typ` so a token of one kind can't stand in for the other.
 */

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_OTP_COOKIE = "admin_otp";
export const ADMIN_SESSION_TTL_SECONDS = 12 * 60 * 60;
export const ADMIN_OTP_TTL_SECONDS = 10 * 60;
export const ADMIN_OTP_MAX_ATTEMPTS = 5;

interface SessionPayload {
  typ: "session";
  exp: number;
  iat: number;
  sid: string;
}

interface OtpPayload {
  typ: "otp";
  exp: number;
  nonce: string;
  /** HMAC of the code with the nonce — verifiable without storing the code. */
  h: string;
}

const now = () => Math.floor(Date.now() / 1000);

function getSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || null;
}

function hmac(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function sign(payload: SessionPayload | OtpPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(secret, body)}`;
}

function verify(token: string | undefined | null): Record<string, unknown> | null {
  const secret = getSecret();
  if (!secret || !token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  if (!safeEqual(hmac(secret, body), token.slice(dot + 1))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof payload?.exp !== "number" || payload.exp < now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function requireSecret(): string {
  const secret = getSecret();
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET env var");
  return secret;
}

// --- Session -----------------------------------------------------------------

export function createSessionToken(): string {
  const iat = now();
  return sign(
    { typ: "session", iat, exp: iat + ADMIN_SESSION_TTL_SECONDS, sid: randomBytes(12).toString("base64url") },
    requireSecret()
  );
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  return verify(token)?.typ === "session";
}

// --- Sign-in code --------------------------------------------------------------

function codeHash(secret: string, nonce: string, code: string): string {
  return hmac(secret, `otp|${nonce}|${code}`);
}

/** A fresh 6-digit code, the cookie value that can later verify it, and its nonce. */
export function createSignInChallenge(): { code: string; token: string; nonce: string } {
  const secret = requireSecret();
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const nonce = randomBytes(12).toString("base64url");
  const token = sign({ typ: "otp", exp: now() + ADMIN_OTP_TTL_SECONDS, nonce, h: codeHash(secret, nonce, code) }, secret);
  return { code, token, nonce };
}

/** The challenge's nonce if the cookie is authentic and unexpired; null otherwise. */
export function readSignInChallenge(token: string | undefined | null): { nonce: string } | null {
  const payload = verify(token);
  return payload?.typ === "otp" && typeof payload.nonce === "string" ? { nonce: payload.nonce } : null;
}

/** Whether `code` is the one this (already authenticated) challenge was issued for. */
export function signInCodeMatches(token: string, code: string): boolean {
  const payload = verify(token);
  const secret = getSecret();
  if (!secret || payload?.typ !== "otp") return false;
  const otp = payload as unknown as OtpPayload;
  const normalised = code.replace(/\s+/g, "");
  return /^\d{6}$/.test(normalised) && safeEqual(codeHash(secret, otp.nonce, normalised), otp.h);
}

/** Cookie attributes shared by both admin cookies. */
export function adminCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}