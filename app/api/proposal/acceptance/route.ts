import { NextRequest, NextResponse } from "next/server";
import {
  verifyProposalAccess,
  verifyEngagementAccess,
  getProposalAcceptance,
  readProposalAcceptance,
  setProposalAcceptance,
  saveProposalSnapshot,
  withProposalLock,
  SheetLockExpiredError,
  type SheetLock,
} from "@/lib/google-sheets";
import type { AcceptanceStatus, ProposalAcceptance, ProposalData } from "@/types/proposal";
import { sendProposalResponseNotice } from "@/lib/email";
import { canonicalProposalJson, proposalVersion } from "@/lib/proposal-version";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proposalId = searchParams.get("proposalId");
  const accessCode = searchParams.get("accessCode");

  if (!proposalId || !accessCode) {
    return NextResponse.json(
      { success: false, error: "proposalId and accessCode are required" },
      { status: 400 }
    );
  }

  // Read-only: an accepted client can still see their acceptance after the
  // offer expires. Submitting (POST) stays on the stricter offer check.
  const verification = await verifyEngagementAccess(proposalId, accessCode);
  if (!verification.success) {
    return NextResponse.json({ success: false, error: verification.error }, { status: 401 });
  }

  const acceptance = await getProposalAcceptance(proposalId);
  return NextResponse.json({ success: true, acceptance });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposalId, accessCode, status, counterNote, packageId, paymentPlanId, proposalVersion: renderedVersion } = body;

    if (!proposalId || !accessCode || !status) {
      return NextResponse.json(
        { success: false, error: "proposalId, accessCode, and status are required" },
        { status: 400 }
      );
    }

    if (status !== "accepted" && status !== "counter") {
      return NextResponse.json(
        { success: false, error: "status must be 'accepted' or 'counter'" },
        { status: 400 }
      );
    }

    if (status === "counter" && !counterNote?.trim()) {
      return NextResponse.json(
        { success: false, error: "counterNote is required when status is 'counter'" },
        { status: 400 }
      );
    }

    if (typeof proposalId !== "string" || typeof accessCode !== "string") {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    // Checked before taking the lock so unauthenticated requests never write
    // lock rows; re-checked inside it against a fresh read.
    const preCheck = await verifyProposalAccess(proposalId, accessCode);
    if (!preCheck.success) {
      return NextResponse.json({ success: false, error: preCheck.error }, { status: 401 });
    }

    // Every check and the write run under the proposal lock that admin saves
    // also take, so a revision can't land between "this is the version they
    // saw" and recording the response — whichever runs second sees the other.
    // A few retries ride out an admin save in progress.
    const locked = await withProposalLock(
      proposalId,
      (lock) =>
        recordResponse(lock, {
          proposalId,
          accessCode,
          status,
          counterNote: status === "counter" ? counterNote.trim() : undefined,
          packageId,
          paymentPlanId,
          renderedVersion,
        }),
      { attempts: 3 }
    );
    if (locked.status === "busy") {
      return NextResponse.json(
        { success: false, error: "This proposal is being updated — please try again in a moment" },
        { status: 503 }
      );
    }
    if ("error" in locked.value) return locked.value.error;
    const { proposal, existing, currentVersion, trimmedNote, trimmedPackageId, trimmedPlanId, snapshotFailed } =
      locked.value.recorded;

    // Joseph-facing notification. Best-effort — if email fails, the response
    // is still recorded; we log and return success.
    try {
      await sendProposalResponseNotice({
        kind: status === "accepted" ? "accepted" : existing?.status === "counter" ? "counter-updated" : "counter",
        clientName: proposal.client.name,
        proposalId,
        projectTitle: proposal.title,
        packageName: proposal.packages?.find((p) => p.id === trimmedPackageId)?.name ?? trimmedPackageId,
        paymentPlanName: proposal.paymentPlans?.find((p) => p.id === trimmedPlanId)?.name ?? trimmedPlanId,
        counterNote: trimmedNote,
        submittedAt: new Date().toISOString(),
        proposalVersion: currentVersion,
        snapshotFailed,
      });
    } catch (error) {
      console.error("Proposal response notice email failed:", error);
    }

    return NextResponse.json({ success: true, proposalVersion: currentVersion });
  } catch (error) {
    console.error("Error saving proposal acceptance:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

type ResponseInput = {
  proposalId: string;
  accessCode: string;
  status: AcceptanceStatus;
  counterNote: string | undefined;
  packageId: unknown;
  paymentPlanId: unknown;
  renderedVersion: unknown;
};

type RecordOutcome =
  | { error: NextResponse }
  | {
      recorded: {
        proposal: ProposalData;
        existing: ProposalAcceptance | null;
        currentVersion: string;
        trimmedNote: string | undefined;
        trimmedPackageId: string | undefined;
        trimmedPlanId: string | undefined;
        snapshotFailed: boolean;
      };
    };

const fail = (body: object, status: number): RecordOutcome => ({
  error: NextResponse.json({ success: false, ...body }, { status }),
});

/** Checks the response against the current terms and records it. Call under the proposal lock. */
async function recordResponse(lock: SheetLock, input: ResponseInput): Promise<RecordOutcome> {
  const { proposalId, accessCode, status, counterNote: trimmedNote, packageId, paymentPlanId, renderedVersion } = input;

  const verification = await verifyProposalAccess(proposalId, accessCode);
  if (!verification.success) return fail({ error: verification.error }, 401);
  const proposal = verification.proposal;
  if (!proposal) return fail({ error: "Proposal not found" }, 404);

  // Once accepted, the deal is closed — reject further submissions. Strict
  // read: an unreadable acceptance must not let a second response through.
  let existing: ProposalAcceptance | null;
  try {
    existing = await readProposalAcceptance(proposalId);
  } catch (error) {
    console.error(`Acceptance for ${proposalId}: existing response unavailable:`, error);
    return fail({ error: "We couldn't record your response just now — please try again in a moment" }, 503);
  }
  if (existing?.status === "accepted") return fail({ error: "This proposal has already been accepted" }, 409);

  // Responses are always made against one specific version of the terms.
  // The page must say which version it rendered: if that differs from the
  // current one (edited while the page was open), or is missing (a page
  // loaded before versioning shipped), the client hasn't verifiably seen the
  // terms they'd be responding to — make them reload first.
  const canonical = canonicalProposalJson(proposal);
  const currentVersion = proposalVersion(proposal);
  if (typeof renderedVersion !== "string" || renderedVersion !== currentVersion) {
    return fail({ code: "stale_version", error: "This proposal was updated — please review the latest version" }, 409);
  }

  // Selections must be options in the current version — an id carried over
  // from an earlier change request may have been removed by a revision.
  // Accepting requires a valid choice wherever the proposal offers options;
  // a change request just ignores ids that no longer exist.
  const packages = proposal.packages ?? [];
  const plans = proposal.paymentPlans ?? [];
  const requestedPackageId = typeof packageId === "string" ? packageId.trim() : "";
  const requestedPlanId = typeof paymentPlanId === "string" ? paymentPlanId.trim() : "";
  const trimmedPackageId = packages.some((p) => p.id === requestedPackageId) ? requestedPackageId : undefined;
  const trimmedPlanId = plans.some((p) => p.id === requestedPlanId) ? requestedPlanId : undefined;
  if (status === "accepted" && ((packages.length > 0 && !trimmedPackageId) || (plans.length > 0 && !trimmedPlanId))) {
    return fail(
      { code: "invalid_selection", error: "Please select one of the package and payment options in this proposal" },
      400
    );
  }

  // Snapshot the terms before recording the response that points at them.
  // Best-effort: a failed snapshot must not stop the client responding — the
  // version hash on the acceptance row still identifies the terms. Running
  // out of lock time is not a snapshot failure: it aborts the whole response.
  let snapshotFailed = false;
  try {
    const result = await saveProposalSnapshot(
      proposalId,
      currentVersion,
      status === "accepted" ? "accepted" : "changes_requested",
      canonical,
      lock
    );
    // Terms too large even when split across cells: only the hash is kept.
    snapshotFailed = result === "too_large";
  } catch (error) {
    if (error instanceof SheetLockExpiredError) throw error;
    snapshotFailed = true;
    console.error(`Proposal snapshot failed for ${proposalId}@${currentVersion}:`, error);
  }

  await setProposalAcceptance(
    proposalId,
    {
      status,
      counterNote: trimmedNote,
      packageId: trimmedPackageId,
      paymentPlanId: trimmedPlanId,
      proposalVersion: currentVersion,
    },
    lock
  );

  return {
    recorded: { proposal, existing, currentVersion, trimmedNote, trimmedPackageId, trimmedPlanId, snapshotFailed },
  };
}
