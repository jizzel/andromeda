import { NextRequest, NextResponse } from "next/server";
import { verifyBriefAccess } from "@/lib/google-sheets";
import type { VerifyBriefResponse } from "@/types/brief";

export async function POST(request: NextRequest): Promise<NextResponse<VerifyBriefResponse>> {
  let body: { briefId?: unknown; accessCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { briefId, accessCode } = body;

  if (!briefId || typeof briefId !== "string") {
    return NextResponse.json(
      { success: false, error: "Brief ID is required" },
      { status: 400 }
    );
  }

  if (!accessCode || typeof accessCode !== "string") {
    return NextResponse.json(
      { success: false, error: "Access code is required" },
      { status: 400 }
    );
  }

  try {
    const result = await verifyBriefAccess(briefId, accessCode.trim());

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      brief: result.brief,
      expiryDate: result.expiryDate,
    });
  } catch (error) {
    console.error("Error in brief verify API:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
