import type { NextRequest } from "next/server";
import { isSameOrigin, requestMeta, throttle } from "@/lib/admin-auth";
import { appendEngagementEvent, getProposalById } from "@/lib/google-sheets";
import { clientJson, AGREEMENT_UPDATING, loadClientAgreement, NOT_AVAILABLE, signerFor } from "@/lib/agreement-client";
import { sendAgreementChangesRequested } from "@/lib/email";
import { MAX_AGREEMENT_CHANGE_NOTE } from "@/constants/agreement";

/**
 * "Request changes" on the agreement: records the client's note (verified
 * signer session required) and emails Joseph. The agreement stays open for
 * signing as it is; to revise it Joseph edits it (voiding his signature and
 * the link), then signs and sends it again.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return clientJson({ success: false, error: "Forbidden" }, 403);
  let body: { proposalId?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return clientJson({ success: false, error: "Invalid request" }, 400);
  }
  const proposalId = typeof body.proposalId === "string" ? body.proposalId.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!note) return clientJson({ success: false, error: "Tell us what you'd like changed." }, 400);
  if (note.length > MAX_AGREEMENT_CHANGE_NOTE) return clientJson({ success: false, error: `Keep the note under ${MAX_AGREEMENT_CHANGE_NOTE} characters.` }, 400);

  const agreement = await loadClientAgreement(proposalId);
  if (!agreement.ok) {
    if (agreement.code === "updating") return clientJson(AGREEMENT_UPDATING, 409);
    return clientJson(agreement.code === "unavailable" ? { success: false, error: "Couldn't load the agreement. Try again." } : NOT_AVAILABLE, agreement.code === "unavailable" ? 503 : 404);
  }
  const { record } = agreement;
  if (record.status !== "sent") return clientJson({ success: false, code: "executed", error: "This agreement has already been signed." }, 409);
  const session = await signerFor(request, proposalId, record);
  if (!session) return clientJson({ success: false, code: "signed_out", error: "Your session has expired or your access has changed. Verify again to continue." }, 401);
  const meta = requestMeta(request);
  if (!throttle(`agreement-changes:${proposalId}`, 5, 60 * 60_000)) return clientJson({ success: false, error: "Too many requests. Try again later." }, 429);

  let at: string;
  try {
    at = await appendEngagementEvent({
      proposalId,
      event: "agreement_changes_requested",
      proposalVersion: record.proposalVersion,
      detail: { agreementHash: record.agreementHash, note, email: session.email },
      ...meta,
    });
  } catch (error) {
    console.error(`Agreement change request for ${proposalId} couldn't be recorded:`, error);
    return clientJson({ success: false, error: "We couldn't send your request. Try again." }, 503);
  }
  try {
    const proposal = await getProposalById(proposalId);
    await sendAgreementChangesRequested({
      clientName: proposal?.data.client?.name ?? proposalId,
      proposalId,
      projectTitle: proposal?.data.title ?? proposalId,
      note,
      requestedAt: at,
      agreementHash: record.agreementHash,
    });
  } catch (error) {
    // Recorded on the sheet (the admin page lists it) even if the email fails.
    console.error(`Agreement change request email for ${proposalId} failed:`, error);
  }
  return clientJson({ success: true, requestedAt: at });
}
