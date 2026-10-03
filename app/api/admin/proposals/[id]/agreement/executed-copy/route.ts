import type { NextRequest } from "next/server";
import { isAdminRequest, isSameOrigin } from "@/lib/admin-auth";
import { readAgreement } from "@/lib/google-sheets";
import { completeExecutionFollowUp } from "@/lib/agreement-execution";
import { json, readJsonBody } from "../../edit";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Completes an executed agreement's follow-up: runs onboarding if no outcome
 * is recorded (or the recorded one failed), restores a missing signing event,
 * and sends the executed copy to each party without a recorded send. With
 * `resend: true` the copy goes to both parties again regardless. Idempotency
 * keys count recorded attempts, so a double click shares one key.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return json({ success: false, error: "Unauthorized" }, 401);
  if (!isSameOrigin(request)) return json({ success: false, error: "Forbidden" }, 403);
  const { id } = await params;
  const body = (await readJsonBody(request)) ?? {};
  const record = await readAgreement(id);
  if (record?.status !== "executed") return json({ success: false, error: "The agreement hasn't been signed by the client." }, 409);
  const result = await completeExecutionFollowUp(new URL(request.url).origin, record, body.resend === true ? { resend: ["client", "provider"] } : {});
  const failed = result.emails.some((m) => m.status === "failed") || (result.onboarding ? result.onboarding.assets === "failed" || result.onboarding.tracker === "failed" : false);
  return json({ success: !failed, ...result });
}
