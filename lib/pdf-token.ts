import { createHmac, timingSafeEqual } from "crypto";

/**
 * Short-lived signed tokens that authorise the headless browser to load a
 * print route: `/proposal/[id]/print` (purpose "proposal") or
 * `/proposal/[id]/agreement/print` (purpose "agreement"). The PDF endpoint
 * verifies access first, then mints a token for that one proposal and purpose
 * — the access code itself never appears in a URL, and a token for one
 * document can't open the other.
 *
 * Format: `<expUnixSeconds>.<base64url HMAC-SHA256>` over `"<proposalId>.<exp>"`
 * (proposal — the original format) or `"agreement:<proposalId>.<exp>"`,
 * keyed with PDF_RENDER_SECRET. Missing secret → sign throws, verify fails closed.
 */

export type PrintPurpose = "proposal" | "agreement";

function getSecret(): string | null {
  return process.env.PDF_RENDER_SECRET || null;
}

function sign(proposalId: string, exp: number, secret: string, purpose: PrintPurpose): string {
  const scope = purpose === "proposal" ? proposalId : `${purpose}:${proposalId}`;
  return createHmac("sha256", secret).update(`${scope}.${exp}`).digest("base64url");
}

export function signPrintToken(proposalId: string, ttlSeconds = 120, purpose: PrintPurpose = "proposal"): string {
  const secret = getSecret();
  if (!secret) throw new Error("Missing PDF_RENDER_SECRET env var");
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `${exp}.${sign(proposalId, exp, secret, purpose)}`;
}

export function verifyPrintToken(proposalId: string, token: string | undefined | null, purpose: PrintPurpose = "proposal"): boolean {
  const secret = getSecret();
  if (!secret || !token) return false;

  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = Number(token.slice(0, dot));
  const signature = token.slice(dot + 1);
  if (!Number.isInteger(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const expected = Buffer.from(sign(proposalId, exp, secret, purpose));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
