import { AlertTriangle, Table2 } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-auth";
import { loadDashboard } from "@/lib/admin-dashboard";
import { profile } from "@/constants/profile";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { DashboardTable } from "@/components/admin/DashboardTable";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const { rows, unavailable } = await loadDashboard();
  const sheetUrl = process.env.GOOGLE_PROPOSALS_SHEET_ID
    ? `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_PROPOSALS_SHEET_ID}/edit`
    : null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--andromeda-accent-beige)] mb-1">
            Andromeda admin
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">Proposals</h1>
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

      <DashboardTable rows={rows} siteUrl={profile.siteUrl} />
    </main>
  );
}
