"use client";

import { motion } from "framer-motion";
import { useBusinessCard } from "./BusinessCardContext";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useEffect, useState } from "react";
import { BusinessCardPreview } from "./BusinessCardPreview";

export function IdentityAnchor() {
  const { openBusinessCard } = useBusinessCard();
  const { trackBusinessCardOpened } = useAnalytics();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    openBusinessCard();
    trackBusinessCardOpened({ source: "identity_anchor" });
  };

  if (!mounted) {
    return null;
  }

  const name = "Attakorah";
  const letters = name.split("");

  return (
    <>
      <BusinessCardPreview isVisible={isHovered || isFocused} />

      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="fixed left-6 top-1/2 -translate-y-1/2 z-30 cursor-pointer focus:outline-none"
        role="button"
        aria-label="Open business card - Attakorah"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
      <motion.div
        className="relative flex flex-col items-center"
        animate={{
          opacity: isHovered ? 1 : [0.88, 1, 0.88],
          filter: isHovered ? "blur(0px)" : ["blur(0.2px)", "blur(0px)", "blur(0.2px)"],
        }}
        transition={
          isHovered
            ? { duration: 0.2, ease: [0.33, 1, 0.68, 1] }
            : {
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      >
        {letters.map((letter, index) => {
          // Subtle luminance variance for each letter
          const luminanceShift = index % 3 === 0 ? 0.95 : index % 2 === 0 ? 0.92 : 1;

          return (
            <motion.span
              key={index}
              className="text-base font-normal leading-tight"
              style={{
                color: `color-mix(in oklch, var(--andromeda-accent-beige), var(--andromeda-text-secondary) ${(1 - luminanceShift) * 100}%)`,
                opacity: luminanceShift,
                display: 'block',
                marginBottom: isHovered ? '0.05em' : '0.08em',
              }}
              animate={{
                opacity: isHovered ? 1 : luminanceShift,
                color: isHovered
                  ? "var(--andromeda-accent-beige)"
                  : `color-mix(in oklch, var(--andromeda-accent-beige), var(--andromeda-text-secondary) ${(1 - luminanceShift) * 100}%)`,
                marginBottom: isHovered ? '0.05em' : '0.08em',
              }}
              transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
            >
              {letter}
            </motion.span>
          );
        })}
      </motion.div>

        {/* Focus ring for accessibility */}
        <motion.div
          className="absolute inset-0 -m-2 rounded border-2 border-[var(--andromeda-accent-beige)]"
          initial={{ opacity: 0 }}
          whileFocus={{ opacity: 0.5 }}
          transition={{ duration: 0.15 }}
        />
      </motion.button>
    </>
  );
}
