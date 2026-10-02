"use client";

import { useEffect, useState } from "react";
import type { ProposalDataUnion } from "@/types/proposal";
import { ProposalShell } from "@/components/proposals/ProposalShell";
import { ProposalDocumentProvider } from "@/components/proposals/ProposalDocumentContext";

/** Message the editor posts to the preview iframe. */
export interface PreviewMessage {
  type: "andromeda:preview";
  data: ProposalDataUnion;
}

/**
 * Live preview of a draft, rendered in the editor's iframe with the same
 * component tree clients see. Non-interactive: no access code (so no PDF
 * download) and the offer treated as closed (so no response form).
 */
export function ProposalPreview({ proposalId, initial }: { proposalId: string; initial: ProposalDataUnion }) {
  const [data, setData] = useState<ProposalDataUnion>(initial);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only the admin editor that embeds this page may drive it.
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      const message = event.data as PreviewMessage | undefined;
      if (message?.type === "andromeda:preview" && message.data && typeof message.data === "object") {
        setData(message.data);
      }
    };
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: "andromeda:preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <ProposalDocumentProvider value={{ printMode: false, proposalId }}>
      <ProposalShell
        proposal={data}
        proposalId={proposalId}
        accessCode=""
        isExpired
        initialAcceptance={null}
      />
    </ProposalDocumentProvider>
  );
}
