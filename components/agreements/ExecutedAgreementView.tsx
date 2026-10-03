"use client";

import { useState, type ReactNode } from "react";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { downloadAgreementPdf } from "./download-agreement-pdf";

interface ExecutedAgreementViewProps {
  proposalId: string;
  agreementHash: string;
  /** Formatted date the client signed. */
  signedAt: string;
  /** The executed document (server-rendered `AgreementDocument`). */
  children: ReactNode;
}

/** The Agreement tab once signed: a confirmation, the PDF, and the document as signed. */
export function ExecutedAgreementView({ proposalId, agreementHash, signedAt, children }: ExecutedAgreementViewProps) {
  const { trackAgreementPdfDownloaded } = useAnalytics();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      // The hub session authenticates the download.
      const failure = await downloadAgreementPdf(proposalId);
      if (failure) setError(failure);
      else trackAgreementPdfDownloaded({ proposal_id: proposalId, agreement_hash_short: agreementHash.slice(0, 12), via: "session" });
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="bg-[var(--andromeda-primary)] px-4 sm:px-6 pt-8 pb-16">
      <div className="max-w-4xl mx-auto">
        <section className="mb-6 p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" aria-hidden />
            <div>
              <h1 className="text-lg font-semibold text-[var(--andromeda-text-primary)]">Agreement signed</h1>
              <p className="text-sm text-[var(--andromeda-text-secondary)]">Signed by both parties on {signedAt}.</p>
            </div>
          </div>
          <Button onClick={() => void download()} disabled={busy} className="bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 font-semibold">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download signed PDF
          </Button>
        </section>
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-400">
            {error}
          </p>
        )}
        <section aria-label="Signed agreement" className="p-5 sm:p-8 rounded-xl border border-white/10 light:border-black/10 bg-[var(--andromeda-secondary)]">
          {children}
        </section>
      </div>
    </main>
  );
}
