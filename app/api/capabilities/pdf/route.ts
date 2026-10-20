import { NextResponse, type NextRequest } from "next/server";
import { CAPABILITIES_LAST_MODIFIED } from "@/constants/capability-catalogue";
import { profile } from "@/constants/profile";
import { getOrRenderPdf, pdfCacheKey, proposalPdfFilename, renderCapabilitiesPdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The one-page capabilities statement as a PDF (public). Rendered from
 * /capabilities/print, cached per instance and on Vercel's CDN (a day, then
 * revalidated), so Chromium runs rarely; a new deployment starts fresh.
 *
 * Only the bare URL renders: any query string gets a permanent redirect to it,
 * so cache-busting parameters (`?x=1`, `?x=2`, …) can't create new CDN keys
 * that each launch Chromium on a cold instance. Every download shares one
 * cached copy.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (url.search) return NextResponse.redirect(new URL(url.pathname, url.origin), 308);
  try {
    const origin = url.origin;
    const pdf = await getOrRenderPdf(pdfCacheKey({ kind: "capabilities", lastModified: CAPABILITIES_LAST_MODIFIED }), () => renderCapabilitiesPdf(origin));
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${proposalPdfFilename(profile.name, "", "capabilities-statement")}"`,
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Capabilities PDF generation failed:", error);
    return NextResponse.json({ success: false, error: "PDF generation failed" }, { status: 500 });
  }
}
