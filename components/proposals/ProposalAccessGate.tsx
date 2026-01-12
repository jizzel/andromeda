"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProposalAccessGateProps {
  proposalId: string;
  onAccessGranted: (proposalData: unknown) => void;
}

export function ProposalAccessGate({
  proposalId,
  onAccessGranted,
}: ProposalAccessGateProps) {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/proposal/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, accessCode }),
      });

      const data = await response.json();

      if (data.success && data.proposal) {
        onAccessGranted(data.proposal);
      } else {
        setError(data.error || "Invalid access code");
      }
    } catch {
      setError("Unable to verify access. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--andromeda-primary)] px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="p-4 rounded-full bg-[var(--andromeda-accent-beige)]/10 border border-[var(--andromeda-accent-beige)]/30">
            <Lock className="w-8 h-8 text-[var(--andromeda-accent-beige)]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-center text-[var(--andromeda-text-primary)] mb-3">
          Protected Proposal
        </h1>
        <p className="text-center text-[var(--andromeda-text-secondary)] mb-8">
          Enter your access code to view this proposal
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="accessCode" className="sr-only">
              Access Code
            </label>
            <input
              id="accessCode"
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter access code"
              className="w-full px-4 py-3 rounded-lg bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10 text-[var(--andromeda-text-primary)] placeholder:text-[var(--andromeda-text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]/50 focus:border-transparent transition-all text-center text-lg tracking-widest uppercase"
              autoComplete="off"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !accessCode.trim()}
            className="w-full bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 py-6 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Access Proposal
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Footer Note */}
        <p className="text-center text-xs text-[var(--andromeda-text-secondary)]/60 mt-8">
          This proposal contains confidential information intended only for the
          recipient. If you received this link in error, please disregard.
        </p>
      </motion.div>
    </div>
  );
}
