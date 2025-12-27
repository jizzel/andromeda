"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  threshold?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  delay = 0,
  threshold = 0.2,
  className,
}: ScrollRevealProps) {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={
        inView
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 20 }
      }
      transition={{
        duration: 0.35,
        delay,
        ease: [0.33, 1, 0.68, 1], // ease-out-cubic
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
