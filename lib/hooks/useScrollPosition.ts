"use client";

import { useEffect, useState } from "react";

export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const updatePosition = () => {
      setScrollPosition(window.scrollY);
    };

    // Set initial position
    updatePosition();

    // Throttle scroll events for performance
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          updatePosition();
          rafId = null;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return scrollPosition;
}
