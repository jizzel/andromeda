import { createHash } from "crypto";
import puppeteer, { type Browser } from "puppeteer-core";
import { NextResponse } from "next/server";
import type { ProposalAcceptance, ProposalData } from "@/types/proposal";
import { signPrintToken, type PrintPurpose } from "@/lib/pdf-token";

/**
 * Server-side proposal PDF export. A headless Chromium loads the token-gated
 * print route (`/proposal/[id]/print`) — the same components as the live page,
 * in print mode — and prints it with the `@media print` styles in globals.css.
 *
 * Chromium: `@sparticuz/chromium` on Vercel; locally, set CHROME_EXECUTABLE_PATH
 * to an installed Chrome (e.g. /Applications/Google Chrome.app/Contents/MacOS/Google Chrome).
 * Keep `puppeteer-core` pinned to the release whose bundled Chrome revision
 * matches `@sparticuz/chromium`'s major version.
 */

const NAV_TIMEOUT_MS = 30_000;
const ASSET_WAIT_MS = 10_000;

async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    const { default: chromium } = await import("@sparticuz/chromium");
    chromium.setGraphicsMode = false;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const executablePath = process.env.CHROME_EXECUTABLE_PATH;
  if (!executablePath) {
    throw new Error("Set CHROME_EXECUTABLE_PATH to a local Chrome binary to generate PDFs outside Vercel");
  }
  return puppeteer.launch({ executablePath, headless: true });
}

export const renderProposalPdf = (origin: string, proposalId: string) => renderPrintRoute(origin, proposalId, "proposal");

/** The executed agreement (`/proposal/[id]/agreement/print`, rendered from its signed snapshot). */
export const renderAgreementPdf = (origin: string, proposalId: string) => renderPrintRoute(origin, proposalId, "agreement");

const PRINT_PATHS: Record<PrintPurpose, string> = { proposal: "print", agreement: "agreement/print" };

async function renderPrintRoute(origin: string, proposalId: string, purpose: PrintPurpose): Promise<Buffer> {
  const url = new URL(`/proposal/${encodeURIComponent(proposalId)}/${PRINT_PATHS[purpose]}`, origin);
  url.searchParams.set("token", signPrintToken(proposalId, 120, purpose));

  // Vercel Deployment Protection on previews: pass the bypass as query params so
  // Vercel sets a same-origin cookie. (setExtraHTTPHeaders would also send the
  // secret to third-party image hosts.)
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) {
    url.searchParams.set("x-vercel-protection-bypass", bypass);
    url.searchParams.set("x-vercel-set-bypass-cookie", "true");
  }

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // The theme script in app/layout.tsx reads localStorage before hydration;
    // pin it to light so `light:` variants apply (print tokens are light too).
    await page.evaluateOnNewDocument(() => {
      try {
        localStorage.setItem("theme", "light");
      } catch {
        // Storage unavailable on non-http documents — nothing to do.
      }
    });

    const response = await page.goto(url.toString(), { waitUntil: "networkidle0", timeout: NAV_TIMEOUT_MS });
    if (!response || !response.ok()) {
      throw new Error(`Print route responded ${response?.status() ?? "without a response"}`);
    }

    // Scroll through once so any lazily-loaded or in-view content is triggered,
    // then wait for fonts and every image before printing.
    await page.evaluate(async (assetWaitMs) => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 50));
      }
      window.scrollTo(0, 0);

      const assetsReady = Promise.all([
        document.fonts.ready,
        ...Array.from(document.images).map((img) =>
          img.complete
            ? null
            : new Promise((r) => {
                img.addEventListener("load", r, { once: true });
                img.addEventListener("error", r, { once: true });
              })
        ),
      ]);
      await Promise.race([assetsReady, new Promise((r) => setTimeout(r, assetWaitMs))]);
    }, ASSET_WAIT_MS);

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true, // A4 + margins from `@page` in globals.css
      // Lays the page out ~880 CSS px wide so two-column (md) grids apply.
      scale: 0.8,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate:
        '<div style="width:100%;font-size:8px;color:#888;text-align:center;font-family:sans-serif;">' +
        '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// In-memory cache. Per function instance: repeat downloads are instant while
// the instance is warm; a cold start regenerates. The key covers everything
// that affects the output, so any sheet edit or deploy produces a fresh PDF.
// Stores the promise, so concurrent requests for the same key share one render.
// ---------------------------------------------------------------------------

const MAX_CACHE_ENTRIES = 20;
const pdfCache = new Map<string, Promise<Buffer>>();

export function pdfCacheKey(parts: Record<string, unknown>): string {
  return createHash("sha256")
    .update(JSON.stringify({ ...parts, deployment: process.env.VERCEL_DEPLOYMENT_ID ?? "local" }))
    .digest("hex");
}

export function getOrRenderPdf(key: string, render: () => Promise<Buffer>): Promise<Buffer> {
  // Always re-render in development so template edits show up immediately.
  if (process.env.NODE_ENV !== "production") return render();

  const cached = pdfCache.get(key);
  if (cached) {
    // Refresh recency for LRU eviction.
    pdfCache.delete(key);
    pdfCache.set(key, cached);
    return cached;
  }

  const pending = render();
  pdfCache.set(key, pending);
  pending.catch(() => pdfCache.delete(key));
  while (pdfCache.size > MAX_CACHE_ENTRIES) {
    const oldest = pdfCache.keys().next().value;
    if (oldest === undefined) break;
    pdfCache.delete(oldest);
  }
  return pending;
}

export function proposalPdfFilename(clientName: string, title: string, kind: "proposal" | "service-agreement" = "proposal"): string {
  const slug = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  const base = [slug(clientName), slug(title)].filter(Boolean).join("-");
  return base ? `${base}-${kind}.pdf` : `${kind}.pdf`;
}

/**
 * Shared by the client export (`/api/proposal/pdf`, after an access-code check)
 * and the admin export (`/api/admin/proposals/[id]/pdf`, after a session check):
 * serve the proposal PDF from cache or render it against `origin`.
 */
export async function proposalPdfResponse(args: {
  origin: string;
  proposalId: string;
  proposal: ProposalData;
  expiryDate?: string;
  acceptance: ProposalAcceptance | null;
}): Promise<NextResponse> {
  const { origin, proposalId, proposal, expiryDate, acceptance } = args;
  const key = pdfCacheKey({ proposalId, data: proposal, expiryDate, acceptance });
  try {
    const pdf = await getOrRenderPdf(key, () => renderProposalPdf(origin, proposalId));
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${proposalPdfFilename(proposal.client.name, proposal.title)}"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Proposal PDF generation failed:", error);
    return NextResponse.json({ success: false, error: "PDF generation failed" }, { status: 500 });
  }
}

const pdfResponse = (pdf: Buffer, filename: string) =>
  new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "private, no-store",
    },
  });

/**
 * The executed agreement's PDF, from cache or rendered. The key covers the
 * agreement hash and both signatures — everything the document shows —
 * so it can't serve a stale copy.
 */
export function getExecutedAgreementPdf(args: { origin: string; proposalId: string; agreementHash: string; providerSignedAt: string; clientSignedAt: string }): Promise<Buffer> {
  const key = pdfCacheKey({ kind: "agreement", ...args, origin: undefined });
  return getOrRenderPdf(key, () => renderAgreementPdf(args.origin, args.proposalId));
}

/** Shared by the client and admin executed-agreement downloads (after their own access checks). */
export async function agreementPdfResponse(args: {
  origin: string;
  proposalId: string;
  agreementHash: string;
  providerSignedAt: string;
  clientSignedAt: string;
  clientName: string;
  title: string;
}): Promise<NextResponse> {
  try {
    const pdf = await getExecutedAgreementPdf(args);
    return pdfResponse(pdf, proposalPdfFilename(args.clientName, args.title, "service-agreement"));
  } catch (error) {
    console.error("Agreement PDF generation failed:", error);
    return NextResponse.json({ success: false, error: "PDF generation failed" }, { status: 500 });
  }
}
