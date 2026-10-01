"use client";

import { AlertTriangle } from "lucide-react";

/** Shown when the dashboard can't load at all (e.g. the Proposals tab is unreadable). */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-amber-500" />
        <h1 className="text-xl font-bold mb-2">Couldn&apos;t load the dashboard</h1>
        <p className="text-sm text-[var(--andromeda-text-secondary)] mb-6">
          The proposals sheet couldn&apos;t be read. This is usually temporary (a Google Sheets hiccup or quota limit).
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-5 py-2.5 rounded-lg font-semibold bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
