"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener (supports both old and new API)
    if (media.addEventListener) {
      media.addEventListener("change", listener);
    } else {
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

// Predefined breakpoint hooks for convenience
export function useIsMobile() {
  return useMediaQuery("(max-width: 640px)");
}

export function useIsTablet() {
  return useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 1025px)");
}
