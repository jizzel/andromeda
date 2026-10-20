"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Calendar, Check, Copy, Download, Mail, UserPlus } from "lucide-react";
import { profile } from "@/constants/profile";
import { openCalendlyPopup } from "@/lib/calendly";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { buttonClass, secondaryButtonClass } from "./styles";

/**
 * The few interactive parts of the server-rendered /capabilities page:
 * view tracking, proof links and the call-to-action buttons.
 */

/** Sends `capabilities_viewed` once per page view; renders nothing. */
export function CapabilitiesViewTracker() {
  const { trackCapabilitiesViewed } = useAnalytics();
  useEffect(() => {
    let referrerHost = "direct";
    try {
      if (document.referrer) referrerHost = new URL(document.referrer).host;
    } catch {
      referrerHost = "unknown";
    }
    trackCapabilitiesViewed({ referrer_host: referrerHost });
    // Once per page view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** A "Built" link to a case study. Records the click; the case study counts its own view. */
export function ProofLink({ capabilityId, slug, className, children }: { capabilityId: string; slug: string; className?: string; children: ReactNode }) {
  const { trackCapabilityProofClicked } = useAnalytics();
  return (
    <Link href={`/projects/${slug}`} onClick={() => trackCapabilityProofClicked({ capability_id: capabilityId, project_slug: slug })} className={className}>
      {children}
    </Link>
  );
}

/** Book a call, email, save contact, download the PDF. */
export function CapabilitiesCta() {
  const { trackCTAClicked } = useAnalytics();
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        type="button"
        onClick={() => {
          trackCTAClicked({ type: "calendly", location: "capabilities_page" });
          openCalendlyPopup();
        }}
        className={`${buttonClass} bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90`}
      >
        <Calendar className="w-4 h-4" /> Book a call
      </button>
      <a href={`mailto:${profile.email}`} onClick={() => trackCTAClicked({ type: "email", location: "capabilities_page" })} className={secondaryButtonClass}>
        <Mail className="w-4 h-4" /> Email me
      </a>
      <Link href="/connect" onClick={() => trackCTAClicked({ type: "connect", location: "capabilities_page" })} className={secondaryButtonClass}>
        <UserPlus className="w-4 h-4" /> Save my contact
      </Link>
      <StatementDownloadLink className={secondaryButtonClass}>
        <Download className="w-4 h-4" /> Download one-page PDF
      </StatementDownloadLink>
    </div>
  );
}

/** Downloads the one-page PDF statement. */
export function StatementDownloadLink({ className, children }: { className?: string; children: ReactNode }) {
  const { trackCTAClicked } = useAnalytics();
  return (
    <a href="/api/capabilities/pdf" download onClick={() => trackCTAClicked({ type: "download", location: "capabilities_page" })} className={className}>
      {children}
    </a>
  );
}

/** Copies the referral introduction to the clipboard. */
export function CopyIntroButton({ text }: { text: string }) {
  const { trackCapabilitiesIntroCopied } = useAnalytics();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setFailed(false);
          setCopied(true);
          trackCapabilitiesIntroCopied();
        } catch {
          setFailed(true);
        }
      }}
      className={`${buttonClass} bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90`}
      aria-live="polite"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copied" : failed ? "Copy failed: select the text instead" : "Copy introduction"}
    </button>
  );
}
