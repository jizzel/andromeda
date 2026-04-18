"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  MessageSquareDiff,
  Send,
  AlertCircle,
  Clock,
  Package,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { formatDate } from "@/lib/dates";
import type { ProposalAcceptance as AcceptanceData, ProposalPackage, ProposalPaymentPlan } from "@/types/proposal";

interface ProposalAcceptanceProps {
  proposalId: string;
  accessCode: string;
  clientName: string;
  isExpired: boolean;
  initialAcceptance: AcceptanceData | null;
  packages?: ProposalPackage[];
  paymentPlans?: ProposalPaymentPlan[];
  selectedPackageId: string | null;
  selectedPlanId: string | null;
}

type ResponseMode = "accepted" | "counter" | null;

export function ProposalAcceptance({
  proposalId,
  accessCode,
  clientName,
  isExpired,
  initialAcceptance,
  packages,
  paymentPlans,
  selectedPackageId,
  selectedPlanId,
}: ProposalAcceptanceProps) {
  const [acceptance, setAcceptance] = useState<AcceptanceData | null>(initialAcceptance);
  const [responseMode, setResponseMode] = useState<ResponseMode>(null);
  const [counterNote, setCounterNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = !!acceptance;

  const handleSubmit = async () => {
    if (!responseMode || !confirmed) return;
    if (responseMode === "counter" && !counterNote.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/proposal/acceptance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId,
          accessCode,
          status: responseMode,
          counterNote: responseMode === "counter" ? counterNote.trim() : undefined,
          packageId: selectedPackageId ?? undefined,
          paymentPlanId: selectedPlanId ?? undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAcceptance({
          status: responseMode,
          counterNote: responseMode === "counter" ? counterNote.trim() : undefined,
          packageId: selectedPackageId ?? undefined,
          paymentPlanId: selectedPlanId ?? undefined,
          acceptedAt: new Date().toISOString(),
        });
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPackage = packages?.find((p) => p.id === (acceptance?.packageId ?? selectedPackageId));
  const selectedPlan = paymentPlans?.find((p) => p.id === (acceptance?.paymentPlanId ?? selectedPlanId));

  // Already submitted — show confirmation state
  if (acceptance) {
    return (
      <section className="w-full py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <ScrollReveal>
            <AnimatePresence mode="wait">
              {acceptance.status === "accepted" ? (
                <motion.div
                  key="accepted"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="p-8 rounded-xl bg-[var(--andromeda-success)]/8 border border-[var(--andromeda-success)]/30"
                >
                  <div className="flex justify-center mb-5">
                    <div className="p-3 rounded-full bg-[var(--andromeda-success)]/15">
                      <CheckCircle2 className="w-8 h-8 text-[var(--andromeda-success)]" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--andromeda-text-primary)] mb-2 text-center">
                    Proposal Accepted
                  </h3>
                  <p className="text-[var(--andromeda-text-secondary)] mb-6 text-center">
                    Thank you, {clientName}. Your acceptance has been received. We&apos;ll be in
                    touch within 1 business day to arrange next steps.
                  </p>

                  {/* Selections summary */}
                  {(selectedPackage || selectedPlan) && (
                    <div className="space-y-2 mb-6 p-4 rounded-lg bg-white/5 light:bg-black/5">
                      {selectedPackage && (
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-[var(--andromeda-accent-beige)] shrink-0" />
                          <span className="text-[var(--andromeda-text-secondary)]">Package:</span>
                          <span className="font-medium text-[var(--andromeda-text-primary)]">{selectedPackage.name}</span>
                          <span className="text-[var(--andromeda-text-secondary)] ml-auto">{selectedPackage.totalPrice}</span>
                        </div>
                      )}
                      {selectedPlan && (
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="w-4 h-4 text-[var(--andromeda-accent-beige)] shrink-0" />
                          <span className="text-[var(--andromeda-text-secondary)]">Payment:</span>
                          <span className="font-medium text-[var(--andromeda-text-primary)]">{selectedPlan.name}</span>
                          <span className="text-[var(--andromeda-text-secondary)] ml-auto">{selectedPlan.totalInvestment}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {acceptance.acceptedAt && (
                    <p className="text-xs text-[var(--andromeda-text-secondary)]/50 flex items-center justify-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Submitted {formatDate(acceptance.acceptedAt)}
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="counter"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="p-8 rounded-xl bg-amber-500/8 border border-amber-500/30"
                >
                  <div className="flex justify-center mb-5">
                    <div className="p-3 rounded-full bg-amber-500/15">
                      <MessageSquareDiff className="w-8 h-8 text-amber-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--andromeda-text-primary)] mb-2 text-center">
                    Changes Noted
                  </h3>
                  <p className="text-[var(--andromeda-text-secondary)] mb-6 text-center">
                    Thank you, {clientName}. Your proposed changes have been received. We&apos;ll
                    review and get back to you shortly.
                  </p>

                  {/* Selections summary */}
                  {(selectedPackage || selectedPlan) && (
                    <div className="space-y-2 mb-6 p-4 rounded-lg bg-white/5 light:bg-black/5">
                      {selectedPackage && (
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-[var(--andromeda-text-secondary)]">Package preference:</span>
                          <span className="font-medium text-[var(--andromeda-text-primary)]">{selectedPackage.name}</span>
                        </div>
                      )}
                      {selectedPlan && (
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-[var(--andromeda-text-secondary)]">Payment preference:</span>
                          <span className="font-medium text-[var(--andromeda-text-primary)]">{selectedPlan.name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {acceptance.counterNote && (
                    <blockquote className="border-l-2 border-amber-500/50 pl-4 py-1 text-sm text-[var(--andromeda-text-secondary)] italic mb-5">
                      &ldquo;{acceptance.counterNote}&rdquo;
                    </blockquote>
                  )}
                  {acceptance.acceptedAt && (
                    <p className="text-xs text-[var(--andromeda-text-secondary)]/50 flex items-center justify-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Submitted {formatDate(acceptance.acceptedAt)}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollReveal>
        </div>
      </section>
    );
  }

  // Expired — no form
  if (isExpired) return null;

  const hasPackages = packages && packages.length > 0;
  const hasPlans = paymentPlans && paymentPlans.length > 0;

  return (
    <section className="w-full py-16 px-6 border-t border-white/5 light:border-black/5">
      <div className="max-w-2xl mx-auto">
        <ScrollReveal>
          <p className="text-sm font-medium text-[var(--andromeda-accent-beige)] uppercase tracking-widest mb-3">
            Your Response
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--andromeda-text-primary)] mb-2">
            Ready to proceed?
          </h2>
          <p className="text-[var(--andromeda-text-secondary)] mb-8">
            Let us know how you&apos;d like to move forward with this proposal.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          {/* Selection summary strip — shows chosen package/plan */}
          <AnimatePresence>
            {(selectedPackageId || selectedPlanId) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mb-6"
              >
                <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-[var(--andromeda-accent-beige)]/5 border border-[var(--andromeda-accent-beige)]/20">
                  {selectedPackage && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Package className="w-3.5 h-3.5 text-[var(--andromeda-accent-beige)]" />
                      <span className="text-[var(--andromeda-text-secondary)]">Package:</span>
                      <span className="font-medium text-[var(--andromeda-text-primary)]">{selectedPackage.name}</span>
                    </div>
                  )}
                  {selectedPackage && selectedPlan && (
                    <span className="text-[var(--andromeda-text-secondary)]/30">·</span>
                  )}
                  {selectedPlan && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <CreditCard className="w-3.5 h-3.5 text-[var(--andromeda-accent-beige)]" />
                      <span className="text-[var(--andromeda-text-secondary)]">Payment:</span>
                      <span className="font-medium text-[var(--andromeda-text-primary)]">{selectedPlan.name}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nudge to select if not yet chosen */}
          {(hasPackages || hasPlans) && (!selectedPackageId || !selectedPlanId) && (
            <p className="text-xs text-[var(--andromeda-text-secondary)]/60 mb-6">
              {!selectedPackageId && hasPackages && !selectedPlanId && hasPlans
                ? "Select a package and payment plan above before submitting."
                : !selectedPackageId && hasPackages
                  ? "Select a package above before submitting."
                  : "Select a payment plan above before submitting."}
            </p>
          )}

          {/* Response mode selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <motion.button
              onClick={() => setResponseMode("accepted")}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={`w-full text-left p-5 rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--andromeda-accent-beige)]/50 ${
                responseMode === "accepted"
                  ? "bg-[var(--andromeda-accent-beige)]/10 border-[var(--andromeda-accent-beige)]/60"
                  : "bg-[var(--andromeda-secondary)] border-white/10 light:border-black/10 hover:border-[var(--andromeda-accent-beige)]/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    responseMode === "accepted"
                      ? "border-[var(--andromeda-accent-beige)] bg-[var(--andromeda-accent-beige)]"
                      : "border-white/30 light:border-black/30"
                  }`}
                >
                  {responseMode === "accepted" && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-[var(--andromeda-primary)]"
                    />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[var(--andromeda-text-primary)] text-sm">
                    Accept as presented
                  </p>
                  <p className="text-xs text-[var(--andromeda-text-secondary)] mt-1">
                    I agree to the terms and scope outlined in this proposal
                  </p>
                </div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => setResponseMode("counter")}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={`w-full text-left p-5 rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--andromeda-accent-beige)]/50 ${
                responseMode === "counter"
                  ? "bg-[var(--andromeda-accent-beige)]/10 border-[var(--andromeda-accent-beige)]/60"
                  : "bg-[var(--andromeda-secondary)] border-white/10 light:border-black/10 hover:border-[var(--andromeda-accent-beige)]/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    responseMode === "counter"
                      ? "border-[var(--andromeda-accent-beige)] bg-[var(--andromeda-accent-beige)]"
                      : "border-white/30 light:border-black/30"
                  }`}
                >
                  {responseMode === "counter" && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-[var(--andromeda-primary)]"
                    />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[var(--andromeda-text-primary)] text-sm">
                    Accept with changes
                  </p>
                  <p className="text-xs text-[var(--andromeda-text-secondary)] mt-1">
                    I&apos;d like to discuss adjustments before proceeding
                  </p>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Counter-note textarea */}
          <AnimatePresence>
            {responseMode === "counter" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden mb-6"
              >
                <label
                  htmlFor="counterNote"
                  className="block text-sm font-medium text-[var(--andromeda-text-secondary)] mb-2"
                >
                  Describe the changes you&apos;d like to discuss
                </label>
                <textarea
                  id="counterNote"
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  rows={4}
                  placeholder="e.g. I'd prefer to split the initial payment into two installments…"
                  className="w-full px-4 py-3 rounded-lg bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10 text-[var(--andromeda-text-primary)] placeholder:text-[var(--andromeda-text-secondary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]/50 focus:border-transparent transition-all resize-none text-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation checkbox */}
          <AnimatePresence>
            {responseMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-6"
              >
                <label className="flex items-start gap-3 cursor-pointer group">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={confirmed}
                    onClick={() => setConfirmed((v) => !v)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--andromeda-accent-beige)]/50 ${
                      confirmed
                        ? "bg-[var(--andromeda-accent-beige)] border-[var(--andromeda-accent-beige)]"
                        : "border-white/30 light:border-black/30 group-hover:border-[var(--andromeda-accent-beige)]/40"
                    }`}
                  >
                    {confirmed && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 text-[var(--andromeda-primary)]"
                        fill="none"
                        viewBox="0 0 12 12"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    )}
                  </button>
                  <span className="text-sm text-[var(--andromeda-text-secondary)] leading-snug">
                    I confirm I have reviewed this proposal in full and understand the terms
                    presented
                  </span>
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <AnimatePresence>
            {responseMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !confirmed ||
                    submitting ||
                    (responseMode === "counter" && !counterNote.trim()) ||
                    locked
                  }
                  className="bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 px-8 py-5 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full inline-block"
                      />
                      Submitting…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Submit Response
                    </span>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollReveal>
      </div>
    </section>
  );
}
