import Link from "next/link";
import { FileText } from "lucide-react";

/** A full-page message on the client agreement route (nothing to sign, can't be signed now, …). */
export function AgreementNotice({ title, children, proposalId }: { title: string; children: React.ReactNode; proposalId: string }) {
  return (
    <main className="flex items-center justify-center bg-[var(--andromeda-primary)] px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-8">
          <div className="p-4 rounded-full bg-[var(--andromeda-accent-beige)]/10 border border-[var(--andromeda-accent-beige)]/30">
            <FileText className="w-8 h-8 text-[var(--andromeda-accent-beige)]" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--andromeda-text-primary)] mb-3">{title}</h1>
        <div className="text-[var(--andromeda-text-secondary)] space-y-3">{children}</div>
        <Link href={`/proposal/${encodeURIComponent(proposalId)}`} className="mt-8 inline-block text-sm underline hover:text-[var(--andromeda-accent-beige)]">
          Go to your proposal
        </Link>
      </div>
    </main>
  );
}
