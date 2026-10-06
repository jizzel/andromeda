import type { NextRequest } from "next/server";
import { isSameOrigin, requestMeta, throttle } from "@/lib/admin-auth";
import { AGREEMENT_SIGNIN_LEDGER, registerSignInAttempt } from "@/lib/google-sheets";
import {
  AGREEMENT_OTP_COOKIE,
  AGREEMENT_OTP_MAX_ATTEMPTS,
  AGREEMENT_SIGNER_COOKIE,
  AGREEMENT_SIGNER_TTL_SECONDS,
  createSignerSession,
  readSignerChallenge,
  signerCodeMatches,
  signerCookieOptions,
} from "@/lib/agreement-signer";
import { accessStillGranted, AGREEMENT_UPDATING, clientJson, loadClientAgreement, NOT_AVAILABLE } from "@/lib/agreement-client";

const fail = (error: string, status = 401, extra: Record<string, unknown> = {}) => clientJson({ success: false, error, ...extra }, status);

/**
 * Step 2: the emailed code. Attempts and single use are decided by the
 * append-only `AgreementSignIns` ledger (same rules as the admin sign-in), so
 * they hold across instances. Success sets a 30-minute signer session bound to
 * the proposal, the agreement hash and the verified address.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Forbidden", 403);
  const { ip, userAgent } = requestMeta(request);
  if (!throttle(`agreement-verify:${ip}`, 10, 60_000)) return fail("Too many attempts. Wait a minute.", 429);
  let code: unknown;
  try {
    ({ code } = await request.json());
  } catch {
    return fail("Invalid request", 400);
  }
  if (typeof code !== "string") return fail("Enter the 6-digit code", 400);

  const token = request.cookies.get(AGREEMENT_OTP_COOKIE)?.value;
  const challenge = readSignerChallenge(token);
  if (!token || !challenge) return fail("This code has expired. Request a new one.");

  try {
    const matches = signerCodeMatches(token, code);
    const attempt = await registerSignInAttempt(AGREEMENT_SIGNIN_LEDGER, challenge.nonce, AGREEMENT_OTP_MAX_ATTEMPTS, matches, ip, userAgent, [challenge.proposalId]);
    if (attempt.status !== "ok") {
      return fail(
        attempt.status === "used"
          ? "This code has already been used. Request a new one."
          : attempt.status === "locked"
            ? "Too many wrong attempts. Request a new code."
            : "This code has expired. Request a new one."
      );
    }
    if (!matches) {
      const attemptsLeft = AGREEMENT_OTP_MAX_ATTEMPTS - attempt.attemptNumber;
      return attemptsLeft > 0
        ? fail(`Incorrect code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left.`, 401, { attemptsLeft })
        : fail("Too many wrong attempts. Request a new code.");
    }

    // The agreement must still be the one the code was issued for.
    const agreement = await loadClientAgreement(challenge.proposalId);
    if (!agreement.ok && agreement.code === "updating") return clientJson(AGREEMENT_UPDATING, 409);
    if (!agreement.ok || agreement.record.status !== "sent") return clientJson(NOT_AVAILABLE, 404);
    if (agreement.record.agreementHash !== challenge.agreementHash) return fail("The agreement changed since this code was sent. Request a new code.", 409);
    if (!(await accessStillGranted(challenge.proposalId, challenge.codeTag))) return fail("Your access to this proposal has changed. Enter your current access code to continue.", 401);

    const response = clientJson({ success: true });
    response.cookies.set(
      AGREEMENT_SIGNER_COOKIE,
      createSignerSession({
        proposalId: challenge.proposalId,
        agreementHash: challenge.agreementHash,
        email: challenge.email,
        codeTag: challenge.codeTag,
        nonce: challenge.nonce,
        verifiedAt: new Date().toISOString(),
      }),
      signerCookieOptions(AGREEMENT_SIGNER_TTL_SECONDS)
    );
    response.cookies.set(AGREEMENT_OTP_COOKIE, "", signerCookieOptions(0));
    return response;
  } catch (error) {
    console.error("Agreement code verification failed:", error);
    return fail("Couldn't verify the code. Try again.", 500);
  }
}
