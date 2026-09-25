"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ProposalAcceptance } from "@/types/proposal";

/**
 * Document-level state shared by the proposal section components, so the
 * three content shells don't have to thread it through as props.
 *
 * `printMode` is true on the headless PDF route and while the browser print
 * dialog is open. Components use it only for what CSS can't do: expanding
 * collapsed content, eager-loading images, and swapping interactive controls
 * for static equivalents. Everything else lives in `@media print` in
 * `app/globals.css`.
 */
interface ProposalDocumentValue {
  printMode: boolean;
  proposalId?: string;
  accessCode?: string;
  /** The acceptance recorded on the sheet — never the viewer's unsaved selection. */
  recordedAcceptance?: ProposalAcceptance | null;
  /** Opens the browser print dialog in print mode. Absent on the PDF route. */
  requestPrint?: () => void;
  /** Called after a response is saved, so the document reflects it without a reload. */
  onAcceptanceRecorded?: (acceptance: ProposalAcceptance) => void;
}

const ProposalDocumentContext = createContext<ProposalDocumentValue>({ printMode: false });

export function ProposalDocumentProvider({
  value,
  children,
}: {
  value: ProposalDocumentValue;
  children: ReactNode;
}) {
  return <ProposalDocumentContext.Provider value={value}>{children}</ProposalDocumentContext.Provider>;
}

export function useProposalDocument(): ProposalDocumentValue {
  return useContext(ProposalDocumentContext);
}
