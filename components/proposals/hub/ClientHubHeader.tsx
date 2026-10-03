"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { availableTabs, hubTabHref, useClientHub, type HubTab } from "./ClientHubProvider";
import { HubBrand } from "./HubBrand";

const TAB_LABELS: Record<HubTab, string> = { proposal: "Proposal", agreement: "Agreement", assets: "Assets", progress: "Progress" };
const TAB_ORDER: HubTab[] = ["proposal", "agreement", "assets", "progress"];

/** Which tab a hub URL belongs to (the accepted-version view sits under Agreement). */
export function tabOfPath(pathname: string, proposalId: string): HubTab {
  const rest = pathname.slice(`/proposal/${encodeURIComponent(proposalId)}`.length);
  if (rest.startsWith("/agreement")) return "agreement";
  if (rest.startsWith("/assets")) return "assets";
  if (rest.startsWith("/tracker")) return "progress";
  return "proposal";
}

/**
 * The client hub's header: a home link to the portfolio, the engagement's
 * name, its tabs (only those this engagement offers), the theme toggle and
 * sign-out. Sticky, so the tabs stay reachable on long pages; tabs scroll
 * sideways on narrow screens.
 */
export function ClientHubHeader() {
  const hub = useClientHub();
  const pathname = usePathname();
  const router = useRouter();
  const { trackClientHubTabViewed } = useAnalytics();
  const [signingOut, setSigningOut] = useState(false);
  const tabs = availableTabs(hub);
  const current = tabOfPath(pathname, hub.proposalId);

  useEffect(() => {
    trackClientHubTabViewed({ proposal_id: hub.proposalId, tab: current });
    // Once per tab shown; the tracker function isn't a stable identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hub.proposalId, current]);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch(`/api/proposal/session?proposalId=${encodeURIComponent(hub.proposalId)}`, { method: "DELETE" });
    } finally {
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 light:border-black/10 bg-[var(--andromeda-primary)]/90 backdrop-blur print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 pt-3">
          <HubBrand />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={signingOut}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-text-primary)] disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden /> Sign out
            </button>
            <ThemeToggle inline />
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--andromeda-text-secondary)] truncate">
          {hub.proposal.client.name} · {hub.proposal.title}
        </p>
        <nav aria-label="Engagement" className="-mx-4 sm:mx-0 mt-1 overflow-x-auto">
          <ul className="flex gap-1 px-4 sm:px-0 min-w-max">
            {TAB_ORDER.filter((tab) => tabs[tab]).map((tab) => {
              const active = tab === current;
              return (
                <li key={tab}>
                  <Link
                    href={hubTabHref(hub.proposalId, tab)}
                    aria-current={active ? "page" : undefined}
                    className={`inline-block px-3 py-2.5 text-sm border-b-2 transition-colors ${
                      active
                        ? "border-[var(--andromeda-accent-beige)] text-[var(--andromeda-text-primary)] font-medium"
                        : "border-transparent text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-text-primary)]"
                    }`}
                  >
                    {TAB_LABELS[tab]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
