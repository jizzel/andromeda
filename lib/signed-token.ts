import { createHmac, timingSafeEqual } from "crypto";

/**
 * Stateless signed tokens for cookies: `<base64url JSON payload>.<base64url
 * HMAC-SHA256 of payload>`. Every payload carries a `typ` (so a token of one
 * kind can't stand in for another) and an `exp` in Unix seconds. Callers pass
 * their own secret; a missing secret fails closed.
 */

export interface TokenPayload {
  typ: string;
  exp: number;
}

export const nowSeconds = () => Math.floor(Date.now() / 1000);

export function hmac(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function signToken(payload: TokenPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(secret, body)}`;
}

/** The payload if the token is authentic, unexpired and (when given) of type `typ`; null otherwise. */
export function verifyToken(token: string | undefined | null, secret: string | null, typ?: string): Record<string, unknown> | null {
  if (!secret || !token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  if (!safeEqual(hmac(secret, body), token.slice(dot + 1))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof payload?.exp !== "number" || payload.exp < nowSeconds()) return null;
    if (typ !== undefined && payload.typ !== typ) return null;
    return payload;
  } catch {
    return null;
  }
}
