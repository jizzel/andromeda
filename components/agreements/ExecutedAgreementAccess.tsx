"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { downloadAgreementPdf } from "./download-agreement-pdf";

interface ExecutedAgreementAccessProps {
  proposalId: string;
  agreementHash: string;
}

/** A signed agreement, later: the executed PDF, behind the proposal access code. */
export function ExecutedAgreementAccess({ proposalId, agreementHash }: ExecutedAgreementAccessProps) {
  const { trackAgreementPdfDownloaded } = useAnalytics();
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const download = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const failure = await downloadAgreementPdf(proposalId, accessCode.trim());
      if (failure) setError(failure);
      else trackAgreementPdfDownloaded({ proposal_id: proposalId, agreement_hash_short: agreementHash.slice(0, 12), via: "access_code" });
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--andromeda-primary)] px-6 py-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-center text-[var(--andromeda-text-primary)] mb-3">Agreement signed</h1>
        <p className="text-center text-[var(--andromeda-text-secondary)] mb-8">
          This agreement is signed by both parties. Enter your proposal access code to download the executed copy.
        </p>
        <form onSubmit={download} className="space-y-4">
          <label htmlFor="executedAccessCode" className="sr-only">
            Access code
          </label>
          <input
            id="executedAccessCode"
            type="password"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Enter access code"
            className="w-full px-4 py-3 rounded-lg bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10 text-[var(--andromeda-text-primary)] placeholder:text-[var(--andromeda-text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]/50 focus:border-transparent text-center text-lg tracking-widest uppercase"
            autoComplete="off"
            disabled={busy}
          />
          {error && (
            <div role="alert" className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          <Button
            type="submit"
            disabled={busy || !accessCode.trim()}
            className="w-full bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 py-6 text-base font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
            Download signed agreement
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
