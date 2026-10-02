"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import type { ProposalRevisionNotice as Revision } from "@/types/proposal";
import { formatDate } from "@/lib/dates";
import { shortVersion } from "@/lib/proposal-version-label";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

interface ProposalRevisionNoticeProps {
  proposalId: string;
  proposalVersion?: string;
  revision: Revision;
}

/**
 * "Revised on {date}" with Joseph's note, above the proposal. Shown when the
 * current version was published as a revision (the verify response only
 * carries a revision for exactly the current version). Not printed: the PDF
 * is the terms, not the conversation about them.
 */
export function ProposalRevisionNotice({ proposalId, proposalVersion, revision }: ProposalRevisionNoticeProps) {
  const { trackProposalRevisionNoticeViewed } = useAnalytics();
  const versionLabel = proposalVersion ? shortVersion(proposalVersion) : "unversioned";
  const hasNote = revision.note.trim().length > 0;

  useEffect(() => {
    trackProposalRevisionNoticeViewed({ proposal_id: proposalId, proposal_version: versionLabel, has_note: hasNote });
    // Once per version — the tracker function identity isn't stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId, versionLabel]);

  return (
    <aside
      aria-label="Revision"
      className="print:hidden relative z-10 border-b border-[var(--andromeda-accent-beige)]/30 bg-[var(--andromeda-accent-beige)]/10"
    >
      {/* pt-20 clears the site's fixed top buttons (Home, theme), which still
          render on proposal routes — drop it with roadmap near-term #1. */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-4 flex items-start gap-3">
        <RefreshCw className="w-4 h-4 mt-1 shrink-0 text-[var(--andromeda-accent-beige)]" aria-hidden />
        <div className="text-sm text-[var(--andromeda-text-primary)]">
          <p className="font-semibold">Revised on {formatDate(revision.publishedAt)}</p>
          {hasNote ? (
            <p className="mt-1 whitespace-pre-line text-[var(--andromeda-text-secondary)]">{revision.note}</p>
          ) : (
            <p className="mt-1 text-[var(--andromeda-text-secondary)]">This proposal has been updated. Please review the terms below.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
