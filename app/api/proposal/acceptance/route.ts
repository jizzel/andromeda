import { NextRequest, NextResponse } from "next/server";
import {
  verifyProposalAccess,
  verifyEngagementAccess,
  getProposalAcceptance,
  setProposalAcceptance,
  saveProposalSnapshot,
} from "@/lib/google-sheets";
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

    const verification = await verifyProposalAccess(proposalId, accessCode);
    if (!verification.success) {
      return NextResponse.json({ success: false, error: verification.error }, { status: 401 });
    }

    // Once accepted, the deal is closed — reject further submissions
    const existing = await getProposalAcceptance(proposalId);
    if (existing?.status === "accepted") {
      return NextResponse.json(
        { success: false, error: "This proposal has already been accepted" },
        { status: 409 }
      );
    }

    const proposal = verification.proposal;
    if (!proposal) {
      return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
    }

    // Responses are always made against one specific version of the terms.
    // If the proposal was edited after this page loaded, the client hasn't
    // seen what they'd be responding to — make them reload first.
    const canonical = canonicalProposalJson(proposal);
    const currentVersion = proposalVersion(proposal);
    if (renderedVersion && renderedVersion !== currentVersion) {
      return NextResponse.json(
        {
          success: false,
          code: "stale_version",
          error: "This proposal was updated — please review the latest version",
        },
        { status: 409 }
      );
    }

    const trimmedNote = status === "counter" ? counterNote.trim() : undefined;

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
      return NextResponse.json(
        {
          success: false,
          code: "invalid_selection",
          error: "Please select one of the package and payment options in this proposal",
        },
        { status: 400 }
      );
    }

    // Snapshot the terms before recording the response that points at them.
    // Best-effort: a failed snapshot must not stop the client responding — the
    // version hash on the acceptance row still identifies the terms.
    let snapshotFailed = false;
    try {
      await saveProposalSnapshot(
        proposalId,
        currentVersion,
        status === "accepted" ? "accepted" : "changes_requested",
        canonical
      );
    } catch (error) {
      snapshotFailed = true;
      console.error(`Proposal snapshot failed for ${proposalId}@${currentVersion}:`, error);
    }

    await setProposalAcceptance(proposalId, {
      status,
      counterNote: trimmedNote,
      packageId: trimmedPackageId,
      paymentPlanId: trimmedPlanId,
      proposalVersion: currentVersion,
    });

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
