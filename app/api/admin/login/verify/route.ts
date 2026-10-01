import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_OTP_COOKIE,
  ADMIN_OTP_MAX_ATTEMPTS,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  adminCookieOptions,
  createSessionToken,
  readSignInChallenge,
  signInCodeMatches,
} from "@/lib/admin-session";
import { isSameOrigin, requestMeta, throttle } from "@/lib/admin-auth";
import { registerAdminSignInAttempt } from "@/lib/google-sheets";
import { sendAdminSignInNotice } from "@/lib/email";

const fail = (error: string, status = 401, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ success: false, error, ...extra }, { status });

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Forbidden", 403);
  const { ip, userAgent } = requestMeta(request);
  if (!throttle(`admin-verify:${ip}`, 10, 60_000)) return fail("Too many attempts. Wait a minute.", 429);

  let code: unknown;
  try {
    ({ code } = await request.json());
  } catch {
    return fail("Invalid request", 400);
  }
  if (typeof code !== "string") return fail("Enter the 6-digit code", 400);

  const token = request.cookies.get(ADMIN_OTP_COOKIE)?.value;
  const challenge = readSignInChallenge(token);
  if (!token || !challenge) return fail("This code has expired. Request a new one.");

  try {
    // The ledger decides atomically across instances (append-only, ordered
    // log): attempt limit and single use don't depend on this process.
    const matches = signInCodeMatches(token, code);
    const attempt = await registerAdminSignInAttempt(challenge.nonce, ADMIN_OTP_MAX_ATTEMPTS, matches, ip, userAgent);
    if (attempt.status !== "ok") {
      const message =
        attempt.status === "used"
          ? "This code has already been used. Request a new one."
          : attempt.status === "locked"
            ? "Too many wrong attempts. Request a new code."
            : "This code has expired. Request a new one.";
      return fail(message);
    }
    if (!matches) {
      const attemptsLeft = ADMIN_OTP_MAX_ATTEMPTS - attempt.attemptNumber;
      return attemptsLeft > 0
        ? fail(`Incorrect code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left.`, 401, { attemptsLeft })
        : fail("Too many wrong attempts. Request a new code.");
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, createSessionToken(), adminCookieOptions(ADMIN_SESSION_TTL_SECONDS));
    response.cookies.set(ADMIN_OTP_COOKIE, "", adminCookieOptions(0));

    // Best-effort heads-up so an unexpected sign-in gets noticed.
    try {
      await sendAdminSignInNotice({ signedInAt: new Date().toISOString(), ip, userAgent });
    } catch (error) {
      console.error("Admin sign-in notice email failed:", error);
    }
    return response;
  } catch (error) {
    console.error("Admin sign-in verification failed:", error);
    return fail("Couldn't verify the code. Try again.", 500);
  }
}
