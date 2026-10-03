import { randomBytes, randomInt } from "crypto";
import { hmac, nowSeconds, safeEqual, signToken, verifyToken } from "@/lib/signed-token";

/**
 * Client signer verification for agreements: before the client can see the
 * signing form, they enter the proposal access code and then a 6-digit code
 * emailed to `client.email` — evidence that the signer controls that address
 * (§29.4). Same mechanics as the admin sign-in (`lib/admin-session.ts`), with
 * its own secret, cookies and ledger (`AgreementSignIns`):
 *
 * - `agreement_otp`: holds a keyed hash of the code (never the code), its
 *   nonce, and the proposal + agreement hash it was issued for. Attempts and
 *   single use are enforced server-side against the nonce by the append-only
 *   ledger (`registerSignInAttempt`).
 * - `agreement_signer`: issued once the code is verified; bound to the
 *   proposal, the agreement hash and the verified email, for 30 minutes. A
 *   changed (voided, re-signed) agreement has a new hash, so old sessions die.
 * - Both carry `codeTag`, a keyed fingerprint of the access code they were
 *   obtained with (never the code). Every step re-reads the proposal and
 *   requires it to be active with the same code (`accessStillGranted`), so
 *   deactivating a proposal or regenerating its code revokes live sessions.
 *
 * Secret: AGREEMENT_SIGNING_SECRET. Missing → every check fails closed.
 */

export const AGREEMENT_OTP_COOKIE = "agreement_otp";
export const AGREEMENT_SIGNER_COOKIE = "agreement_signer";
export const AGREEMENT_OTP_TTL_SECONDS = 10 * 60;
export const AGREEMENT_SIGNER_TTL_SECONDS = 30 * 60;
export const AGREEMENT_OTP_MAX_ATTEMPTS = 5;

interface OtpPayload {
  typ: "agreement_otp";
  exp: number;
  proposalId: string;
  agreementHash: string;
  /** Where the code was sent (the proposal's `client.email` at the time). */
  email: string;
  /** Fingerprint of the access code used (see `accessCodeTag`). */
  codeTag: string;
  nonce: string;
  /** HMAC of the code with the nonce — verifiable without storing the code. */
  h: string;
}

export interface SignerSession {
  typ: "agreement_signer";
  exp: number;
  proposalId: string;
  agreementHash: string;
  /** The address the code was sent to. */
  email: string;
  /** Fingerprint of the access code the signer entered (see `accessCodeTag`). */
  codeTag: string;
  /** The redeemed challenge. */
  nonce: string;
  verifiedAt: string;
}

const getSecret = () => process.env.AGREEMENT_SIGNING_SECRET || null;

function requireSecret(): string {
  const secret = getSecret();
  if (!secret) throw new Error("Missing AGREEMENT_SIGNING_SECRET env var");
  return secret;
}

export const signingConfigured = () => !!getSecret();

const codeHash = (secret: string, nonce: string, code: string) => hmac(secret, `agreement-otp|${nonce}|${code}`);

/** A fresh 6-digit code for this proposal's current agreement, the cookie that can verify it, and its nonce. */
export function createSignerChallenge(proposalId: string, agreementHash: string, email: string, codeTag: string): { code: string; token: string; nonce: string } {
  const secret = requireSecret();
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const nonce = randomBytes(12).toString("base64url");
  const payload: OtpPayload = {
    typ: "agreement_otp",
    exp: nowSeconds() + AGREEMENT_OTP_TTL_SECONDS,
    proposalId,
    agreementHash,
    email,
    codeTag,
    nonce,
    h: codeHash(secret, nonce, code),
  };
  return { code, token: signToken(payload, secret), nonce };
}

/** The challenge if the cookie is authentic and unexpired; null otherwise. */
export function readSignerChallenge(token: string | undefined | null): Omit<OtpPayload, "h" | "typ" | "exp"> | null {
  const payload = verifyToken(token, getSecret(), "agreement_otp") as unknown as OtpPayload | null;
  if (!payload || [payload.nonce, payload.proposalId, payload.agreementHash, payload.email, payload.codeTag].some((v) => typeof v !== "string")) return null;
  return { proposalId: payload.proposalId, agreementHash: payload.agreementHash, email: payload.email, codeTag: payload.codeTag, nonce: payload.nonce };
}

/** Whether `code` is the one this (already authenticated) challenge was issued for. */
export function signerCodeMatches(token: string, code: string): boolean {
  const secret = getSecret();
  const payload = verifyToken(token, secret, "agreement_otp") as unknown as OtpPayload | null;
  if (!secret || !payload) return false;
  const normalised = code.replace(/\s+/g, "");
  return /^\d{6}$/.test(normalised) && safeEqual(codeHash(secret, payload.nonce, normalised), payload.h);
}

export function createSignerSession(input: Omit<SignerSession, "typ" | "exp">): string {
  return signToken({ typ: "agreement_signer", exp: nowSeconds() + AGREEMENT_SIGNER_TTL_SECONDS, ...input } satisfies SignerSession, requireSecret());
}

/** The signer session if authentic, unexpired and for this proposal; null otherwise. Callers also check the hash against the record. */
export function readSignerSession(token: string | undefined | null, proposalId: string): SignerSession | null {
  const payload = verifyToken(token, getSecret(), "agreement_signer") as unknown as SignerSession | null;
  if (!payload || payload.proposalId !== proposalId || typeof payload.agreementHash !== "string" || typeof payload.email !== "string" || typeof payload.codeTag !== "string") return null;
  return payload;
}

/**
 * Cookie attributes for both signer cookies. Set and sent only by same-site
 * fetches from the agreement page, so `strict` holds. Path `/`: a cookie has
 * one path, and both the page (`/proposal/…`) and the APIs (`/api/proposal/…`)
 * read it.
 */
export function signerCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/**
 * Keyed fingerprint of a proposal access code, normalised the way access
 * checks compare codes (trimmed, case-insensitive). Lets a token remember
 * which code it was obtained with without containing it.
 */
export function accessCodeTag(accessCode: string): string {
  return hmac(requireSecret(), `access-code|${accessCode.trim().toLowerCase()}`).slice(0, 22);
}

/** "j•••@gmail.com" — enough for the client to recognise the address. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "your email address";
  return `${local.slice(0, 1)}•••@${domain}`;
}
