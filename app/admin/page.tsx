import { FileDown, ExternalLink, AlertTriangle, Table2 } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-auth";
import { loadDashboard, UNAVAILABLE, type DashboardRow, type LifecycleState } from "@/lib/admin-dashboard";
import { profile } from "@/constants/profile";
import { formatDate } from "@/lib/dates";
import { CopyButton } from "@/components/admin/CopyButton";
import { SignOutButton } from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

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

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const { rows, unavailable } = await loadDashboard();
  const counts = SUMMARY_ORDER.map((state) => ({ state, n: rows.filter((r) => r.state === state).length })).filter(
    (c) => c.n > 0
  );
  const sheetUrl = process.env.GOOGLE_PROPOSALS_SHEET_ID
    ? `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_PROPOSALS_SHEET_ID}/edit`
    : null;

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--andromeda-accent-beige)] mb-1">
            Andromeda admin
          </p>
          <h1 className="text-3xl font-bold">Proposals</h1>
        </div>
        <div className="flex items-center gap-6">
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)]"
            >
              <Table2 className="w-4 h-4" />
              Open sheet
            </a>
          )}
          <SignOutButton />
        </div>
      </header>

      {unavailable.length > 0 && (
        <div role="alert" className="flex items-start gap-3 p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
          <p>
            Couldn&apos;t read {unavailable.join(", ")} from the sheet. Affected columns show as unavailable
            {unavailable.includes("ProposalAcceptance") ? " and proposal states can't be determined" : ""}. Reload to
            try again.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {counts.map(({ state, n }) => (
          <span key={state} className={`px-3 py-1 rounded-full text-xs font-medium ${STATE_META[state].className}`}>
            {STATE_META[state].label} · {n}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 light:border-black/10">
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
            {rows.map((row) => (
              <tr key={row.id} className="align-top hover:bg-white/[0.02] light:hover:bg-black/[0.02]">
                <td className="px-4 py-4">
                  <p className="font-semibold">{row.clientName}</p>
                  <p className="text-[var(--andromeda-text-secondary)] max-w-xs">{row.title}</p>
                  <p className="text-xs text-[var(--andromeda-text-secondary)]/60 mt-1 font-mono">
                    {row.id} · {row.type}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATE_META[row.state].className}`}>
                    {STATE_META[row.state].label}
                  </span>
                  {row.termsChangedSinceAcceptance && (
                    <p className="flex items-center gap-1 mt-2 text-xs text-amber-500" title="The proposal data was edited after the client accepted.">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Terms changed since acceptance
                    </p>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <OfferCell row={row} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-[var(--andromeda-text-secondary)]">
                  {row.response === UNAVAILABLE ? <Unavailable /> : row.response?.at ? formatDate(row.response.at) : "—"}
                </td>
                <td className="px-4 py-4">
                  <Progress value={row.assets} empty="—" />
                </td>
                <td className="px-4 py-4">
                  <Progress value={row.tracker} empty="—" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1 min-w-[180px]">
                    <CopyButton value={`${profile.siteUrl}/proposal/${row.id}`} label="Link" />
                    <CopyButton value={row.accessCode} label="Code" />
                    {row.state !== "draft" && (
                      <a
                        href={`/api/admin/proposals/${encodeURIComponent(row.id)}/pdf`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)] hover:bg-[var(--andromeda-accent-beige)]/10"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    )}
                    <a
                      href={`/proposal/${encodeURIComponent(row.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)] hover:bg-[var(--andromeda-accent-beige)]/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[var(--andromeda-text-secondary)]">
                  No proposals found on the sheet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
