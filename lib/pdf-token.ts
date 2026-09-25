import { createHmac, timingSafeEqual } from "crypto";

/**
 * Short-lived signed tokens that authorise the headless browser to load
 * `/proposal/[id]/print`. The PDF endpoint verifies the client's access code,
 * then mints a token for that one proposal — the access code itself never
 * appears in a URL.
 *
 * Format: `<expUnixSeconds>.<base64url HMAC-SHA256 of "<proposalId>.<exp>">`
 * keyed with PDF_RENDER_SECRET. Missing secret → sign throws, verify fails closed.
 */

function getSecret(): string | null {
  return process.env.PDF_RENDER_SECRET || null;
}

function sign(proposalId: string, exp: number, secret: string): string {
  return createHmac("sha256", secret).update(`${proposalId}.${exp}`).digest("base64url");
}

export function signPrintToken(proposalId: string, ttlSeconds = 120): string {
  const secret = getSecret();
  if (!secret) throw new Error("Missing PDF_RENDER_SECRET env var");
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `${exp}.${sign(proposalId, exp, secret)}`;
}

export function verifyPrintToken(proposalId: string, token: string | undefined | null): boolean {
  const secret = getSecret();
  if (!secret || !token) return false;

  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = Number(token.slice(0, dot));
  const signature = token.slice(dot + 1);
  if (!Number.isInteger(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const expected = Buffer.from(sign(proposalId, exp, secret));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
