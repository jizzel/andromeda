"use client";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 px-6">
      <p className="text-center text-xs text-[var(--andromeda-text-secondary)]/40">
        &copy; {currentYear} Attakorah. All rights reserved.
      </p>
    </footer>
  );
}
