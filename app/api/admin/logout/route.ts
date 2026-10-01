import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, adminCookieOptions } from "@/lib/admin-session";
import { isSameOrigin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", adminCookieOptions(0));
  return response;
}
