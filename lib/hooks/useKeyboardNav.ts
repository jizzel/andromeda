"use client";

import { useEffect } from "react";

interface KeyboardNavOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onTab?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  enabled?: boolean;
}

export function useKeyboardNav(options: KeyboardNavOptions) {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          options.onEscape?.();
          break;
        case "Enter":
          options.onEnter?.();
          break;
        case " ":
          if (options.onSpace) {
            event.preventDefault(); // Prevent page scroll
            options.onSpace();
          }
          break;
        case "Tab":
          options.onTab?.();
          break;
        case "ArrowUp":
          if (options.onArrowUp) {
            event.preventDefault(); // Prevent default scroll
            options.onArrowUp();
          }
          break;
        case "ArrowDown":
          if (options.onArrowDown) {
            event.preventDefault();
            options.onArrowDown();
          }
          break;
        case "ArrowLeft":
          options.onArrowLeft?.();
          break;
        case "ArrowRight":
          options.onArrowRight?.();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, options]);
}
