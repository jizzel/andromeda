"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface ExpandCollapseProps {
  children: ReactNode;
  isExpanded: boolean;
  className?: string;
}

export function ExpandCollapse({
  children,
  isExpanded,
  className,
}: ExpandCollapseProps) {
  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{
            duration: 0.25,
            ease: [0.33, 1, 0.68, 1], // ease-out-cubic
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
