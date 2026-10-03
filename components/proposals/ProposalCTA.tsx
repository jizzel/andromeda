"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";
import { useState } from "react";
import { Calendar, Mail, Clock, ArrowRight, CheckCircle2, FileDown, FileSignature, FolderOpen, ListChecks, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { openCalendlyPopup } from "@/lib/calendly";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import Link from "next/link";
import { useProposalDocument } from "./ProposalDocumentContext";
import { shortVersion } from "@/lib/proposal-version-label";

interface ProposalCTAProps {
  expiryDate?: string;
  clientName: string;
  contactEmail?: string;
  contactPhone?: string;
  proposalId?: string;
  assetsReady?: boolean;
  trackerReady?: boolean;
}

export function ProposalCTA({
  expiryDate,
  contactEmail = "joseph@attakorah.com",
  contactPhone,
  proposalId,
  assetsReady,
  trackerReady,
}: ProposalCTAProps) {
  const { trackProposalAssetsOpened, trackProposalTrackerOpened, trackProposalPdfDownloaded, trackProposalAgreementOpened } = useAnalytics();
  const { printMode, accessCode, recordedAcceptance, requestPrint, proposalVersion, agreementStatus } = useProposalDocument();
  const [pdfState, setPdfState] = useState<"idle" | "loading" | "error">("idle");
  const formattedExpiry = expiryDate ? formatDate(expiryDate) : null;
  const acceptedAt =
    recordedAcceptance?.status === "accepted" && recordedAcceptance.acceptedAt
      ? formatDate(recordedAcceptance.acceptedAt)
      : null;
  // The printed terms are the current version; flag it if acceptance was against another.
  const acceptedVersion = recordedAcceptance?.status === "accepted" ? recordedAcceptance.proposalVersion : undefined;
  const acceptedDifferentVersion = !!acceptedVersion && !!proposalVersion && acceptedVersion !== proposalVersion;
  // The live hub page (the only one with `requestPrint`): its session — or a
  // held access code — authenticates the download. Not in the admin preview.
  const canGeneratePdf = !!proposalId && !!requestPrint;

  const downloadPdf = async () => {
    if (!canGeneratePdf || pdfState === "loading") return;
    setPdfState("loading");
    try {
      const res = await fetch("/api/proposal/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, accessCode }),
      });
      if (!res.ok) throw new Error(`PDF request failed: ${res.status}`);
      const blob = await res.blob();
      const filename =
        res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "proposal.pdf";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setPdfState("idle");
      trackProposalPdfDownloaded({ proposal_id: proposalId, method: "generated" });
    } catch {
      setPdfState("error");
    }
  };

  const printProposal = () => {
    if (proposalId) trackProposalPdfDownloaded({ proposal_id: proposalId, method: "print" });
    requestPrint?.();
  };

  // Static closing block for the printed/PDF document — no buttons.
  if (printMode) {
    return (
      <section
        id="next-steps"
        className="print-avoid-break relative w-full py-12 px-6 bg-[var(--andromeda-secondary)]"
        aria-labelledby="cta-heading"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 id="cta-heading" className="text-2xl font-bold mb-4 text-[var(--andromeda-text-primary)]">
            Next Steps
          </h2>
          {acceptedAt ? (
            <p className="text-base font-medium text-[var(--andromeda-accent-beige)] mb-4">
              Proposal accepted on {acceptedAt}
            </p>
          ) : formattedExpiry ? (
            <p className="text-base font-medium text-[var(--andromeda-accent-beige)] mb-4">
              This proposal is valid until {formattedExpiry}
            </p>
          ) : null}
          <p className="text-sm text-[var(--andromeda-text-secondary)]">
            Questions or next steps: {contactEmail}
            {contactPhone ? ` · ${contactPhone}` : ""}
          </p>
          {proposalVersion && (
            <p className="text-xs text-[var(--andromeda-text-secondary)] mt-3">
              Proposal version {shortVersion(proposalVersion)}
              {acceptedDifferentVersion && acceptedVersion
                ? ` · accepted version was ${shortVersion(acceptedVersion)}`
                : ""}
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      id="next-steps"
      className="relative w-full py-24 md:py-32 px-6 bg-gradient-to-b from-[var(--andromeda-primary)] to-[var(--andromeda-secondary)]"
      aria-labelledby="cta-heading"
    >
      <div className="max-w-3xl mx-auto text-center">
        <ScrollReveal>
          {/* Accepted: the offer window no longer matters — say where things stand. */}
          {acceptedAt ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden />
              <span className="text-sm text-emerald-500 font-medium">Accepted on {acceptedAt}</span>
            </div>
          ) : formattedExpiry && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--andromeda-accent-beige)]/10 border border-[var(--andromeda-accent-beige)]/30 mb-8">
              <Clock className="w-4 h-4 text-[var(--andromeda-accent-beige)]" />
              <span className="text-sm text-[var(--andromeda-accent-beige)] font-medium">
                This proposal is valid until {formattedExpiry}
              </span>
            </div>
          )}

          {acceptedAt ? (
            <>
              <h2 id="cta-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-[var(--andromeda-text-primary)]">
                What&apos;s next
              </h2>
              <p className="text-lg text-[var(--andromeda-text-secondary)] mb-10 max-w-xl mx-auto">
                Thank you for accepting this proposal. Everything for the engagement — your agreement, the assets we need and the
                project&apos;s progress — opens here as each step is ready.
              </p>
            </>
          ) : (
            <>
              <h2
                id="cta-heading"
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-[var(--andromeda-text-primary)]"
              >
                Ready to Transform Your
                <span className="block text-[var(--andromeda-accent-beige)]">
                  Business?
                </span>
              </h2>

              <p className="text-lg text-[var(--andromeda-text-secondary)] mb-10 max-w-xl mx-auto">
                Let&apos;s discuss this proposal and answer any questions you may have.
                We&apos;re excited to help bring your vision to life.
              </p>
            </>
          )}
        </ScrollReveal>

        {/* CTA Buttons */}
        <ScrollReveal delay={0.2}>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-4 mb-12">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                onClick={() => openCalendlyPopup()}
                className="bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 px-8 py-6 text-base font-semibold"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Meeting
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            {agreementStatus && proposalId && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  asChild
                  size="lg"
                  className="bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 px-8 py-6 text-base font-semibold"
                >
                  <Link
                    href={`/proposal/${proposalId}/agreement`}
                    onClick={() => trackProposalAgreementOpened({ proposal_id: proposalId, status: agreementStatus })}
                  >
                    <FileSignature className="w-5 h-5 mr-2" />
                    {agreementStatus === "sent" ? "Review and Sign Agreement" : "View Signed Agreement"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </motion.div>
            )}

            {assetsReady && proposalId && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  asChild
                  size="lg"
                  className="bg-[var(--andromeda-highlight)] text-white hover:bg-[var(--andromeda-highlight)]/90 px-8 py-6 text-base font-semibold"
                >
                  <Link
                    href={`/proposal/${proposalId}/assets`}
                    onClick={() => proposalId && trackProposalAssetsOpened({ proposal_id: proposalId })}
                  >
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Provide Project Assets
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </motion.div>
            )}

            {trackerReady && proposalId && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  asChild
                  size="lg"
                  className="bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 px-8 py-6 text-base font-semibold"
                >
                  <Link
                    href={`/proposal/${proposalId}/tracker`}
                    onClick={() => proposalId && trackProposalTrackerOpened({ proposal_id: proposalId })}
                  >
                    <ListChecks className="w-5 h-5 mr-2" />
                    View Project Tracker
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </motion.div>
            )}
          </div>
        </ScrollReveal>

        {/* Document actions */}
        {requestPrint && (
          <ScrollReveal delay={0.25}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 -mt-4">
              {canGeneratePdf && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={downloadPdf}
                  disabled={pdfState === "loading"}
                  className="border-[var(--andromeda-accent-beige)]/50 text-[var(--andromeda-text-primary)] hover:bg-[var(--andromeda-accent-beige)]/10 px-6 py-5 text-sm"
                >
                  {pdfState === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Preparing PDF…
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              )}
              <button
                type="button"
                onClick={printProposal}
                className="flex items-center gap-2 text-sm text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)] transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print / Save as PDF
              </button>
            </div>
            {pdfState === "error" && (
              <p role="alert" className="text-sm text-[var(--andromeda-error)] -mt-6 mb-10">
                The PDF couldn&apos;t be generated right now. Please use &ldquo;Print / Save as PDF&rdquo; instead.
              </p>
            )}
          </ScrollReveal>
        )}

        {/* Contact Info */}
        <ScrollReveal delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[var(--andromeda-text-secondary)]">
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-2 hover:text-[var(--andromeda-accent-beige)] transition-colors"
            >
              <Mail className="w-4 h-4" />
              {contactEmail}
            </a>
            {contactPhone && (
              <a
                href={`tel:${contactPhone}`}
                className="flex items-center gap-2 hover:text-[var(--andromeda-accent-beige)] transition-colors"
              >
                <span className="w-4 h-4 flex items-center justify-center">📞</span>
                {contactPhone}
              </a>
            )}
          </div>
        </ScrollReveal>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-[var(--andromeda-accent-beige)]/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-[var(--andromeda-accent-beige)]/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </section>
  );
}
