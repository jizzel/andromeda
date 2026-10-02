"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, ExternalLink, FileDown, MessageSquareDiff, PencilLine } from "lucide-react";
import { UNAVAILABLE, type DashboardRow, type LifecycleState } from "@/lib/admin-dashboard-types";
import { formatDate } from "@/lib/dates";
import { shortVersion } from "@/lib/proposal-version-label";
import { CopyButton } from "./CopyButton";
import { DuplicateButton } from "./DuplicateButton";

const STATE_META: Record<LifecycleState, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-white/5 light:bg-black/5 text-[var(--andromeda-text-secondary)]" },
  sent: { label: "Sent", className: "bg-[var(--andromeda-highlight)]/15 text-[var(--andromeda-highlight)]" },
  expiring: { label: "Expiring", className: "bg-amber-500/15 text-amber-500" },
  expired: { label: "Expired", className: "bg-[var(--andromeda-error)]/10 text-[var(--andromeda-error)]" },
  changes_requested: { label: "Changes requested", className: "bg-amber-500/15 text-amber-500" },
  revised: { label: "Revised · awaiting client", className: "bg-[var(--andromeda-highlight)]/15 text-[var(--andromeda-highlight)]" },
  accepted: { label: "Accepted", className: "bg-[var(--andromeda-success)]/15 text-[var(--andromeda-success)]" },
  unknown: { label: "Unknown", className: "bg-white/5 light:bg-black/5 text-[var(--andromeda-text-secondary)]" },
};

// States that need Joseph to do something, shown first in the summary.
const SUMMARY_ORDER: LifecycleState[] = ["changes_requested", "expiring", "revised", "sent", "accepted", "expired", "draft", "unknown"];

const Unavailable = () => <span className="text-xs text-amber-500">Unavailable</span>;

const actionClass =
  "inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)] hover:bg-[var(--andromeda-accent-beige)]/10";

/**
 * Summary chips + proposals, as a table from `md` up and as cards on phones.
 * Both layouts render the same row pieces below, so they can't drift apart.
 * Client-side only for the expandable change requests; all data comes from
 * the server-rendered dashboard.
 */
export function DashboardTable({ rows, siteUrl }: { rows: DashboardRow[]; siteUrl: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const ids = rows.map((r) => r.id);
  const counts = SUMMARY_ORDER.map((state) => ({ state, n: rows.filter((r) => r.state === state).length })).filter(
    (c) => c.n > 0
  );

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        {counts.map(({ state, n }) => (
          <span key={state} className={`px-3 py-1 rounded-full text-xs font-medium ${STATE_META[state].className}`}>
            {STATE_META[state].label} · {n}
          </span>
        ))}
      </div>

      {rows.length === 0 && (
        <p className="px-4 py-10 text-center text-[var(--andromeda-text-secondary)] rounded-xl border border-white/10 light:border-black/10">
          No proposals found on the sheet.
        </p>
      )}

      {/* Phones: one card per proposal */}
      {rows.length > 0 && (
        <ul className="md:hidden space-y-3">
          {rows.map((row) => {
            const open = expanded.has(row.id);
            return (
              <li key={row.id} className="rounded-xl border border-white/10 light:border-black/10 bg-[var(--andromeda-secondary)]/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <ProposalTitle row={row} />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3">
                  <StatePill row={row} open={open} onToggle={() => toggle(row.id)} controlsId={`change-request-card-${row.id}`} />
                  <span className="text-xs">
                    <OfferSummary row={row} />
                  </span>
                </div>
                {row.termsChangedSinceAcceptance && <TermsChanged />}
                {row.changeRequest && (
                  <RequestSnippet row={row} open={open} onToggle={() => toggle(row.id)} controlsId={`change-request-card-${row.id}`} className="mt-3 text-sm" />
                )}
                {row.changeRequest && open && (
                  <div id={`change-request-card-${row.id}`} className="mt-3">
                    <ChangeRequestDetails proposalId={row.id} request={row.changeRequest} />
                  </div>
                )}
                {(row.assets || row.tracker) && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <LabelledProgress label="Assets" value={row.assets} />
                    <LabelledProgress label="Tracker" value={row.tracker} />
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-white/5 light:border-black/5">
                  <RowActions row={row} siteUrl={siteUrl} ids={ids} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Tablet and up: table */}
      {rows.length > 0 && (
        <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10 light:border-black/10">
          <table className="w-full text-sm">
            <thead className="bg-[var(--andromeda-secondary)] text-left text-xs uppercase tracking-wider text-[var(--andromeda-text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Proposal</th>
                <th className="px-4 py-3 font-semibold">State</th>
                <th className="px-4 py-3 font-semibold">Offer until</th>
                <th className="px-4 py-3 font-semibold">Response</th>
                <th className="px-4 py-3 font-semibold">Assets</th>
                <th className="px-4 py-3 font-semibold">Tracker</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 light:divide-black/5">
              {rows.map((row) => {
                const open = expanded.has(row.id);
                return (
                  <Fragment key={row.id}>
                    <tr className={`align-top hover:bg-white/[0.02] light:hover:bg-black/[0.02] ${open ? "bg-white/[0.02] light:bg-black/[0.02]" : ""}`}>
                      <td className="px-4 py-4">
                        <ProposalTitle row={row} />
                      </td>
                      <td className="px-4 py-4">
                        <StatePill row={row} open={open} onToggle={() => toggle(row.id)} controlsId={`change-request-${row.id}`} />
                        {row.termsChangedSinceAcceptance && <TermsChanged />}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <OfferCell row={row} />
                      </td>
                      <td className="px-4 py-4 text-[var(--andromeda-text-secondary)]">
                        {row.response === UNAVAILABLE ? (
                          <Unavailable />
                        ) : (
                          <span className="whitespace-nowrap">{row.response?.at ? formatDate(row.response.at) : "—"}</span>
                        )}
                        {row.changeRequest && (
                          <RequestSnippet row={row} open={open} onToggle={() => toggle(row.id)} controlsId={`change-request-${row.id}`} className="mt-1 max-w-[260px] text-xs" />
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Progress value={row.assets} empty="—" />
                      </td>
                      <td className="px-4 py-4">
                        <Progress value={row.tracker} empty="—" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-[180px]">
                          <RowActions row={row} siteUrl={siteUrl} ids={ids} />
                        </div>
                      </td>
                    </tr>
                    {row.changeRequest && open && (
                      <tr id={`change-request-${row.id}`} className="bg-white/[0.02] light:bg-black/[0.02]">
                        <td colSpan={7} className="px-4 pb-5 pt-0">
                          <div className="md:ml-4">
                            <ChangeRequestDetails proposalId={row.id} request={row.changeRequest} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// --- Row pieces shared by the table and the cards -------------------------------

function ProposalTitle({ row }: { row: DashboardRow }) {
  return (
    <div className="min-w-0">
      <Link href={`/admin/proposals/${encodeURIComponent(row.id)}`} className="group block">
        <p className="font-semibold group-hover:text-[var(--andromeda-accent-beige)]">{row.clientName}</p>
        <p className="text-[var(--andromeda-text-secondary)] md:max-w-xs group-hover:underline">{row.title}</p>
      </Link>
      <p className="text-xs text-[var(--andromeda-text-secondary)]/60 mt-1 font-mono break-all">
        {row.id} · {row.type}
      </p>
    </div>
  );
}

function StatePill({
  row,
  open,
  onToggle,
  controlsId,
}: {
  row: DashboardRow;
  open: boolean;
  onToggle: () => void;
  /** id of the details element this toggles (the table and cards use different ones). */
  controlsId: string;
}) {
  const badge = (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATE_META[row.state].className}`}>
      {row.changeRequest && <ChevronRight className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} />}
      {STATE_META[row.state].label}
    </span>
  );
  if (!row.changeRequest) return badge;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controlsId}
      title={open ? "Hide the change request" : "Show the change request"}
      className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--andromeda-accent-beige)]/50"
    >
      {badge}
    </button>
  );
}

function RequestSnippet({
  row,
  open,
  onToggle,
  controlsId,
  className = "",
}: {
  row: DashboardRow;
  open: boolean;
  onToggle: () => void;
  controlsId: string;
  className?: string;
}) {
  if (!row.changeRequest) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controlsId}
      className={`block text-left italic text-[var(--andromeda-text-primary)]/80 hover:text-[var(--andromeda-accent-beige)] focus:outline-none focus-visible:underline ${className}`}
    >
      <span className="line-clamp-2">&ldquo;{row.changeRequest.note || "No note"}&rdquo;</span>
    </button>
  );
}

function TermsChanged() {
  return (
    <p className="flex items-center gap-1 mt-2 text-xs text-amber-500" title="The proposal data was edited after the client accepted.">
      <AlertTriangle className="w-3.5 h-3.5" />
      Terms changed since acceptance
    </p>
  );
}

function RowActions({ row, siteUrl, ids }: { row: DashboardRow; siteUrl: string; ids: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      <CopyButton value={`${siteUrl}/proposal/${row.id}`} label="Link" />
      <CopyButton value={row.accessCode} label="Code" />
      <DuplicateButton proposalId={row.id} existingIds={ids} />
      {row.state !== "draft" && (
        <a href={`/api/admin/proposals/${encodeURIComponent(row.id)}/pdf`} className={actionClass}>
          <FileDown className="w-3.5 h-3.5" />
          PDF
        </a>
      )}
      <a href={`/proposal/${encodeURIComponent(row.id)}`} target="_blank" rel="noopener noreferrer" className={actionClass}>
        <ExternalLink className="w-3.5 h-3.5" />
        Open
      </a>
    </div>
  );
}

function Progress({ value, empty }: { value: DashboardRow["assets"]; empty: string }) {
  if (value === UNAVAILABLE) return <Unavailable />;
  if (!value) return <span className="text-[var(--andromeda-text-secondary)]/50">{empty}</span>;
  const pct = value.total ? Math.round((value.done / value.total) * 100) : 0;
  return (
    <div className="min-w-[90px]">
      <div className="flex justify-between text-xs mb-1">
        <span>
          {value.done}/{value.total}
        </span>
        {!value.unlocked && <span className="text-[var(--andromeda-text-secondary)]/60">locked</span>}
      </div>
      <div className="h-1.5 rounded-full bg-white/10 light:bg-black/10 overflow-hidden">
        <div className="h-full bg-[var(--andromeda-accent-beige)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LabelledProgress({ label, value }: { label: string; value: DashboardRow["assets"] }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)] mb-1">{label}</p>
      <Progress value={value} empty="—" />
    </div>
  );
}

function OfferCell({ row }: { row: DashboardRow }) {
  if (row.daysLeft === null) return <span className="text-[var(--andromeda-error)]">Invalid date</span>;
  const date = formatDate(row.expiryDate);
  if (row.state === "accepted") return <span className="text-[var(--andromeda-text-secondary)]">{date}</span>;
  if (row.daysLeft < 0) return <span className="text-[var(--andromeda-text-secondary)]">Closed {date}</span>;
  return (
    <span>
      {date}
      <span className="block text-xs text-[var(--andromeda-text-secondary)]">
        {row.daysLeft === 0 ? "today" : `${row.daysLeft} day${row.daysLeft === 1 ? "" : "s"} left`}
      </span>
    </span>
  );
}

/** One-line offer status for the cards. */
function OfferSummary({ row }: { row: DashboardRow }) {
  if (row.daysLeft === null) return <span className="text-[var(--andromeda-error)]">Invalid expiry date</span>;
  if (row.state === "accepted") return <span className="text-[var(--andromeda-text-secondary)]">Offer closed</span>;
  if (row.daysLeft < 0) return <span className="text-[var(--andromeda-text-secondary)]">Closed {formatDate(row.expiryDate)}</span>;
  return (
    <span className={row.daysLeft <= 3 ? "text-amber-500" : "text-[var(--andromeda-text-secondary)]"}>
      {row.daysLeft === 0 ? "Expires today" : `${row.daysLeft} day${row.daysLeft === 1 ? "" : "s"} left`}
    </span>
  );
}

function ChangeRequestDetails({ proposalId, request }: { proposalId: string; request: NonNullable<DashboardRow["changeRequest"]> }) {
  const preference = [request.packageName, request.planName].filter(Boolean).join(" · ");
  return (
    <div className="p-4 rounded-lg border border-amber-500/25 bg-amber-500/[0.04]">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-wider text-amber-500 mb-3">
        <MessageSquareDiff className="w-3.5 h-3.5" />
        Change request
        <span className="font-normal normal-case tracking-normal text-[var(--andromeda-text-secondary)]">
          {request.at && `· ${formatDate(request.at)}`}
          {request.version && ` · on version ${shortVersion(request.version)}`}
        </span>
      </p>
      <blockquote className="border-l-2 border-amber-500/50 pl-4 mb-3 text-sm whitespace-pre-wrap text-[var(--andromeda-text-primary)]">
        {request.note || <span className="italic text-[var(--andromeda-text-secondary)]">The client didn&apos;t leave a note.</span>}
      </blockquote>
      {preference && (
        <p className="text-sm text-[var(--andromeda-text-secondary)] mb-3">
          <span className="font-medium text-[var(--andromeda-text-primary)]">Their preference:</span> {preference}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm ${request.revised ? "text-[var(--andromeda-highlight)]" : "text-amber-500"}`}>
          {request.revised
            ? "Revised since this request — waiting for the client to review and accept."
            : "Not revised yet — saving content changes in the editor publishes the revision."}
        </p>
        <Link
          href={`/admin/proposals/${encodeURIComponent(proposalId)}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90"
        >
          <PencilLine className="w-4 h-4" />
          {request.revised ? "Open editor" : "Open editor to revise"}
        </Link>
      </div>
    </div>
  );
}
