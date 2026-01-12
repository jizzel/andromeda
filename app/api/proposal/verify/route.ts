import { NextRequest, NextResponse } from "next/server";
import { verifyProposalAccess } from "@/lib/google-sheets";
import type { VerifyAccessResponse } from "@/types/proposal";

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
    const result = await verifyProposalAccess(proposalId, accessCode.trim());

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      proposal: result.proposal,
    });
  } catch (error) {
    console.error("Error in proposal verify API:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
