import Link from "next/link";
import { Home } from "lucide-react";
import { profile } from "@/constants/profile";

/** The wordmark that leads back to the portfolio — the hub's "Home". */
export function HubBrand() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-wide text-[var(--andromeda-text-primary)] hover:text-[var(--andromeda-accent-beige)] transition-colors"
      aria-label={`${profile.surname}, portfolio home`}
    >
      <Home className="w-4 h-4" aria-hidden />
      {profile.surname}
    </Link>
  );
}
