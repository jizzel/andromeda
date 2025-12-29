"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { motion } from "framer-motion";

export function HomeButton() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  // Don't show on homepage
  if (isHomePage) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 0.5, y: 0 }}
      whileHover={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-40"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[var(--andromeda-secondary)] text-[var(--andromeda-text-primary)] border border-white/10 light:border-black/10 hover:bg-[var(--andromeda-secondary)]/80 transition-colors text-sm"
        aria-label="Go to homepage"
      >
        <Home size={16} />
        <span>Home</span>
      </Link>
    </motion.div>
  );
}
