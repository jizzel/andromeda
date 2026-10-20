import type { Metadata } from "next";
import { STATEMENT_TITLE } from "@/constants/capability-catalogue";
import { profile } from "@/constants/profile";
import { CapabilitiesStatement } from "@/components/capabilities/CapabilitiesStatement";

export const metadata: Metadata = {
  title: `${STATEMENT_TITLE}: ${profile.name}`,
  robots: { index: false, follow: false },
};

/** The one-page statement that /api/capabilities/pdf prints (no site chrome: see ClientLayout). */
export default function CapabilitiesPrintPage() {
  return (
    <main className="bg-[var(--andromeda-primary)] p-6 print:p-0">
      <CapabilitiesStatement />
    </main>
  );
}
