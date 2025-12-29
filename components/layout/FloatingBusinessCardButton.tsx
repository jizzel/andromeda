"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import { useBusinessCard } from "./BusinessCardContext";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useEffect, useState } from "react";

export function FloatingBusinessCardButton() {
  const { openBusinessCard } = useBusinessCard();
  const { trackBusinessCardOpened } = useAnalytics();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    openBusinessCard();
    trackBusinessCardOpened({ source: "floating_button" });
  };

  if (!mounted) {
    return null;
  }

  return (
    <motion.button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-30 p-3 rounded-full bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10 hover:bg-opacity-80 transition-colors duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ boxShadow: "var(--shadow-2)" }}
      aria-label="Open business card"
      title="View business card"
    >
      <User size={20} className="text-[var(--andromeda-text-primary)]" />
    </motion.button>
  );
}
