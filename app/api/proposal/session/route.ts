import { NextResponse, type NextRequest } from "next/server";
import { isSameOrigin, requestMeta, throttle } from "@/lib/admin-auth";
import { verifyEngagementAccess } from "@/lib/google-sheets";
import {
  CLIENT_SESSION_TTL_SECONDS,
  clientSessionCookieName,
  clientSessionCookieOptions,
  clientSessionsConfigured,
  createClientSession,
} from "@/lib/client-session";

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

/** Opens the client hub: checks the access code once and sets the 12-hour session cookie. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return json({ success: false, error: "Forbidden" }, 403);
  const { ip } = requestMeta(request);
  if (!throttle(`proposal-session:${ip}`, 20, 10 * 60_000)) return json({ success: false, error: "Too many attempts. Wait a few minutes." }, 429);
  let body: { proposalId?: unknown; accessCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid request" }, 400);
  }
  const proposalId = typeof body.proposalId === "string" ? body.proposalId.trim() : "";
  const accessCode = typeof body.accessCode === "string" ? body.accessCode.trim() : "";
  if (!proposalId || !accessCode) return json({ success: false, error: "Enter your access code." }, 400);

  const access = await verifyEngagementAccess(proposalId, accessCode);
  if (!access.success) return json({ success: false, error: access.error ?? "Invalid access code" }, 401);
  if (!clientSessionsConfigured()) {
    console.error("CLIENT_SESSION_SECRET is not set — client hub sessions are disabled");
    return json({ success: false, error: "Access is temporarily unavailable. Please contact us." }, 503);
  }
  const response = json({ success: true, session: true });
  response.cookies.set(clientSessionCookieName(proposalId), createClientSession(proposalId, accessCode), clientSessionCookieOptions(CLIENT_SESSION_TTL_SECONDS));
  return response;
}

/** Signs out of the hub for this proposal. */
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return json({ success: false, error: "Forbidden" }, 403);
  const proposalId = new URL(request.url).searchParams.get("proposalId")?.trim() ?? "";
  if (!proposalId) return json({ success: false, error: "Proposal ID is required" }, 400);
  const response = json({ success: true });
  response.cookies.set(clientSessionCookieName(proposalId), "", clientSessionCookieOptions(0));
  return response;
}
