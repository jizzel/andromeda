"use client";

import { useState } from "react";
import { ProposalAccessGate } from "./ProposalAccessGate";
import { AssetsContent } from "./AssetsContent";
import type { ProposalDataUnion } from "@/types/proposal";
import { motion } from "framer-motion";
import { FolderX } from "lucide-react";
import Link from "next/link";

interface AssetsPageWrapperProps {
  proposalId: string;
}

function AssetsNotAvailable({ proposalId }: { proposalId: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--andromeda-primary)] px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-[var(--andromeda-accent-beige)]/10 border border-[var(--andromeda-accent-beige)]/30">
            <FolderX className="w-8 h-8 text-[var(--andromeda-accent-beige)]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[var(--andromeda-text-primary)] mb-3">
          Asset Request Not Ready
        </h1>
        <p className="text-[var(--andromeda-text-secondary)] mb-8">
          The asset request for this proposal hasn&apos;t been prepared yet. Please check back after signing the service agreement.
        </p>
        <Link
          href={`/proposal/${proposalId}`}
          className="text-sm text-[var(--andromeda-accent-beige)] hover:underline"
        >
          ← Back to proposal
        </Link>
      </motion.div>
    </div>
  );
}

export function AssetsPageWrapper({ proposalId }: AssetsPageWrapperProps) {
  const [proposal, setProposal] = useState<ProposalDataUnion | null>(null);
  const [accessCode, setAccessCode] = useState<string>("");

  if (!proposal) {
    return (
      <ProposalAccessGate
        proposalId={proposalId}
        onAccessGranted={(data, _expiry, code) => {
          setProposal(data as ProposalDataUnion);
          setAccessCode(code ?? "");
        }}
      />
    );
  }

  if (!proposal.assets) {
    return <AssetsNotAvailable proposalId={proposalId} />;
  }

  return (
    <AssetsContent
      proposalId={proposalId}
      accessCode={accessCode}
      assets={proposal.assets}
      clientName={proposal.client.name}
    />
  );
}
