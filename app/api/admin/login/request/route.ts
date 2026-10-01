import { NextRequest, NextResponse } from "next/server";
import { ADMIN_OTP_COOKIE, ADMIN_OTP_TTL_SECONDS, adminCookieOptions, createSignInChallenge } from "@/lib/admin-session";
import { isSameOrigin, requestMeta, throttle } from "@/lib/admin-auth";
import { recordAdminSignInChallenge } from "@/lib/google-sheets";
import { sendAdminSignInCode } from "@/lib/email";

/**
 * Emails a one-time sign-in code to the profile address (never a
 * request-supplied one) and sets the challenge cookie that can verify it.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  // One admin: throttle the endpoint as a whole, not per caller.
  if (!throttle("admin-code:burst", 1, 30_000) || !throttle("admin-code:hourly", 10, 60 * 60_000)) {
    return NextResponse.json(
      { success: false, error: "A code was sent recently. Check your inbox or try again shortly." },
      { status: 429 }
    );
  }

  try {
    const { ip, userAgent } = requestMeta(request);
    const { code, token, nonce } = createSignInChallenge();
    await recordAdminSignInChallenge(nonce, ip, userAgent);
    await sendAdminSignInCode({ code, expiresInMinutes: ADMIN_OTP_TTL_SECONDS / 60, ip });

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_OTP_COOKIE, token, adminCookieOptions(ADMIN_OTP_TTL_SECONDS));
    return response;
  } catch (error) {
    console.error("Admin sign-in code request failed:", error);
    return NextResponse.json({ success: false, error: "Couldn't send a sign-in code." }, { status: 500 });
  }
}
