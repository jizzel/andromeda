import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { isSameOrigin } from "@/lib/admin-auth";
import { verifyEngagementAccess, verifyProposalAccess, type AccessCodeMatcher } from "@/lib/google-sheets";
import { accessCodeTag, nowSeconds, signToken, verifyToken } from "@/lib/signed-token";
import type { ProposalData } from "@/types/proposal";

/**
 * Client hub sessions: the client enters the proposal access code once and
 * gets a signed, httpOnly cookie that keeps them in across the hub's tabs,
 * reloads and emailed links for 12 hours.
 *
 * - One cookie per proposal (`proposal_session_<short hash of id>`), so two
 *   proposals in one browser don't collide.
 * - The token holds `codeTag`, a keyed fingerprint of the access code (never
 *   the code). Every use re-reads the proposal and requires it active, still
 *   on that code, and inside the engagement rule (past the offer only if
 *   accepted) — so deactivating a proposal or regenerating its code ends
 *   live sessions immediately.
 * - `SameSite=Lax`, so the first click from an email carries it; state-changing
 *   requests authenticated by the cookie must also be same-origin.
 *
 * Secret: CLIENT_SESSION_SECRET. Missing → no sessions (the access-code path
 * still works).
 */

export const CLIENT_SESSION_TTL_SECONDS = 12 * 60 * 60;

interface SessionPayload {
  typ: "proposal_session";
  exp: number;
  proposalId: string;
  codeTag: string;
}

const getSecret = () => process.env.CLIENT_SESSION_SECRET || null;

export const clientSessionsConfigured = () => !!getSecret();

export function clientSessionCookieName(proposalId: string): string {
  return `proposal_session_${createHash("sha256").update(proposalId).digest("hex").slice(0, 12)}`;
}

export function clientSessionCookieOptions(maxAgeSeconds: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: maxAgeSeconds };
}

/** A session token for a proposal opened with `accessCode` (already verified by the caller). */
export function createClientSession(proposalId: string, accessCode: string): string {
  const secret = getSecret();
  if (!secret) throw new Error("Missing CLIENT_SESSION_SECRET env var");
  const payload: SessionPayload = { typ: "proposal_session", exp: nowSeconds() + CLIENT_SESSION_TTL_SECONDS, proposalId, codeTag: accessCodeTag(secret, accessCode) };
  return signToken(payload, secret);
}

/** Matches the stored access code against a session's fingerprint, or null if the token is invalid for this proposal. */
function sessionMatcher(token: string | undefined, proposalId: string): AccessCodeMatcher | null {
  const secret = getSecret();
  const payload = verifyToken(token, secret, "proposal_session") as unknown as SessionPayload | null;
  if (!secret || !payload || payload.proposalId !== proposalId || typeof payload.codeTag !== "string") return null;
  return (stored) => accessCodeTag(secret, stored) === payload.codeTag;
}

export type ClientAccess =
  | { ok: true; proposal: ProposalData; expiryDate: string; via: "session" | "code" }
  | { ok: false; status: number; error: string; code?: "signed_out" };

const SIGNED_OUT: ClientAccess = { ok: false, status: 401, error: "Your session has ended. Enter your access code to continue.", code: "signed_out" };

async function verifyWith(proposalId: string, matcher: string | AccessCodeMatcher, strict: boolean, via: "session" | "code"): Promise<ClientAccess> {
  const result = strict ? await verifyProposalAccess(proposalId, matcher) : await verifyEngagementAccess(proposalId, matcher);
  if (!result.success || !result.proposal || !result.expiryDate) {
    return via === "session" ? SIGNED_OUT : { ok: false, status: 401, error: result.error ?? "Invalid access code" };
  }
  return { ok: true, proposal: result.proposal, expiryDate: result.expiryDate, via };
}

/**
 * Authorises a client API request for a proposal: an explicit access code
 * when given (kept for compatibility), otherwise the hub session cookie.
 * `strict` applies the offer check (submitting a response) instead of the
 * engagement check. Cookie-authenticated non-GET requests must be same-origin.
 */
export async function resolveClientAccess(
  request: NextRequest,
  proposalId: string,
  options: { accessCode?: string | null; strict?: boolean } = {}
): Promise<ClientAccess> {
  if (!proposalId) return { ok: false, status: 400, error: "Proposal ID is required" };
  const credential = clientCredential(request, proposalId, options.accessCode);
  if (!credential.ok) return credential;
  return verifyWith(proposalId, credential.match, options.strict ?? false, credential.via);
}

/**
 * The request's credential for a proposal, unverified: the explicit access
 * code, else the session's fingerprint matcher. For callers that must
 * re-verify later with the same credential (e.g. again inside a lock).
 */
export function clientCredential(
  request: NextRequest,
  proposalId: string,
  accessCode?: string | null
): { ok: true; match: string | AccessCodeMatcher; via: "session" | "code" } | Extract<ClientAccess, { ok: false }> {
  const code = accessCode?.trim();
  if (code) return { ok: true, match: code, via: "code" };
  const matcher = sessionMatcher(request.cookies.get(clientSessionCookieName(proposalId))?.value, proposalId);
  if (!matcher) return SIGNED_OUT as Extract<ClientAccess, { ok: false }>;
  if (request.method !== "GET" && !isSameOrigin(request)) return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, match: matcher, via: "session" };
}

/** The hub session for a server component (layout/page), or null. */
export async function hubAccess(proposalId: string): Promise<Extract<ClientAccess, { ok: true }> | null> {
  const matcher = sessionMatcher((await cookies()).get(clientSessionCookieName(proposalId))?.value, proposalId);
  if (!matcher) return null;
  const access = await verifyWith(proposalId, matcher, false, "session");
  return access.ok ? access : null;
}
