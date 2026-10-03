import { NextRequest, NextResponse } from "next/server";
import { getPublishedRevision, verifyEngagementAccess } from "@/lib/google-sheets";
import type { VerifyAccessResponse } from "@/types/proposal";
import { proposalVersion } from "@/lib/proposal-version";
import { clientAgreementStatus } from "@/lib/agreement-client";

export async function POST(request: NextRequest): Promise<NextResponse<VerifyAccessResponse>> {
  try {
    const body = await request.json();
    const { proposalId, accessCode } = body;

    // Validate input
    if (!proposalId || typeof proposalId !== "string") {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 }
      );
    }

    if (!accessCode || typeof accessCode !== "string") {
      return NextResponse.json(
        { success: false, error: "Access code is required" },
        { status: 400 }
      );
    }

    // Verify access
    const result = await verifyEngagementAccess(proposalId, accessCode.trim());

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    const version = result.proposal ? proposalVersion(result.proposal) : undefined;
    // Only a revision published for exactly these terms: an edit after
    // publishing (a new version) drops the notice until it's published too.
    const [revision, agreementStatus] = await Promise.all([
      version ? getPublishedRevision(proposalId, version) : null,
      clientAgreementStatus(proposalId),
    ]);

    return NextResponse.json({
      success: true,
      proposal: result.proposal,
      expiryDate: result.expiryDate,
      proposalVersion: version,
      ...(revision && { revision: { publishedAt: revision.publishedAt, note: revision.note } }),
      ...(agreementStatus && { agreement: { status: agreementStatus } }),
    });
  } catch (error) {
    console.error("Error in proposal verify API:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
