import type { NextRequest } from "next/server";
import { isSameOrigin, requestMeta, throttle } from "@/lib/admin-auth";
import { AGREEMENT_SIGNIN_LEDGER, getProposalById, recordSignInChallenge } from "@/lib/google-sheets";
import { resolveClientAccess } from "@/lib/client-session";
import { accessCodeTag, AGREEMENT_OTP_COOKIE, AGREEMENT_OTP_TTL_SECONDS, createSignerChallenge, maskEmail, signerCookieOptions, signingConfigured } from "@/lib/agreement-signer";
import { clientJson, loadClientAgreement, NOT_AVAILABLE } from "@/lib/agreement-client";
import { sendAgreementSignInCode } from "@/lib/email";

/**
 * Step 1 of signing in to sign: the proposal access code (or the client hub
 * session, which already proved it), then a one-time code emailed to the
 * proposal's saved `client.email` (never an address from the request). The challenge cookie is bound to this proposal and the
 * agreement hash as it stands.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return clientJson({ success: false, error: "Forbidden" }, 403);
  const { ip, userAgent } = requestMeta(request);
  let body: { proposalId?: unknown; accessCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return clientJson({ success: false, error: "Invalid request" }, 400);
  }
  const proposalId = typeof body.proposalId === "string" ? body.proposalId.trim() : "";
  const accessCode = typeof body.accessCode === "string" ? body.accessCode.trim() : "";
  if (!proposalId) return clientJson({ success: false, error: "Proposal ID is required" }, 400);
  if (!throttle(`agreement-code-ip:${ip}`, 10, 60 * 60_000)) return clientJson({ success: false, error: "Too many requests. Try again later." }, 429);

  const access = await resolveClientAccess(request, proposalId, { accessCode });
  if (!access.ok) return clientJson({ success: false, error: accessCode ? access.error : "Enter your access code.", code: access.code }, access.status);
  if (!signingConfigured()) {
    console.error("AGREEMENT_SIGNING_SECRET is not set — client agreement sign-in is disabled");
    return clientJson({ success: false, error: "Signing isn't available right now. Please contact us." }, 503);
  }
  const agreement = await loadClientAgreement(proposalId);
  if (!agreement.ok) return clientJson(agreement.code === "unavailable" ? { success: false, error: "Couldn't load the agreement. Try again." } : NOT_AVAILABLE, agreement.code === "unavailable" ? 503 : 404);
  if (agreement.record.status !== "sent") return clientJson({ success: false, code: "executed", error: "This agreement has already been signed." }, 409);
  const to = access.proposal.client?.email?.trim();
  if (!to) return clientJson({ success: false, error: "There's no email address on file for this proposal. Please contact us." }, 409);

  // Per proposal (any instance-local burst) — the ledger caps attempts per code.
  if (!throttle(`agreement-code:${proposalId}:burst`, 1, 30_000)) return clientJson({ success: false, error: "A code was just sent. Wait 30 seconds before asking for another." }, 429);
  if (!throttle(`agreement-code:${proposalId}:hourly`, 5, 60 * 60_000)) return clientJson({ success: false, error: "Too many codes requested. Try again in an hour." }, 429);

  try {
    // Bind the signer to the access code in force (typed now, or proven by the hub session).
    const code = accessCode || (await getProposalById(proposalId))?.accessCode || "";
    if (!code) return clientJson({ success: false, error: "Couldn't load the proposal. Try again." }, 503);
    const challenge = createSignerChallenge(proposalId, agreement.record.agreementHash, to, accessCodeTag(code));
    await recordSignInChallenge(AGREEMENT_SIGNIN_LEDGER, challenge.nonce, ip, userAgent, [proposalId]);
    await sendAgreementSignInCode({
      to,
      clientName: access.proposal.client?.name ?? "",
      projectTitle: access.proposal.title,
      code: challenge.code,
      expiresInMinutes: AGREEMENT_OTP_TTL_SECONDS / 60,
    });
    const response = clientJson({ success: true, sentTo: maskEmail(to), expiresInMinutes: AGREEMENT_OTP_TTL_SECONDS / 60 });
    response.cookies.set(AGREEMENT_OTP_COOKIE, challenge.token, signerCookieOptions(AGREEMENT_OTP_TTL_SECONDS));
    return response;
  } catch (error) {
    console.error(`Agreement sign-in code for ${proposalId} failed:`, error);
    return clientJson({ success: false, error: "Couldn't send the code. Try again in a moment." }, 502);
  }
}
