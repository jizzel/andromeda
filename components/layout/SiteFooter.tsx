"use client";

import { profile } from "@/constants/profile";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 px-6">
      <p className="text-center text-xs text-[var(--andromeda-text-secondary)]/40">
        &copy; {currentYear} {profile.surname}. All rights reserved.
      </p>
    </footer>
  );
}
