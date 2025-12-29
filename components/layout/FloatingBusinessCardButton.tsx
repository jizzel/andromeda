"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useBusinessCard } from "./BusinessCardContext";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useEffect, useState } from "react";
import { profile } from "@/constants/profile";

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
      className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--andromeda-accent-beige)] hover:border-[var(--andromeda-highlight)] transition-colors duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ boxShadow: "var(--shadow-2)" }}
      aria-label="Open business card"
      title="View business card"
    >
      <Image
        src={profile.profileImage}
        alt={profile.name}
        width={48}
        height={48}
        className="object-cover w-full h-full"
        priority
      />
    </motion.button>
  );
}
