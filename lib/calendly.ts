/**
 * Utility functions for Calendly integration
 */
import { socialLinks } from "@/constants/profile";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

/**
 * Opens Calendly popup widget
 */
export function openCalendlyPopup(url: string = socialLinks.calendly) {
  if (typeof window !== "undefined" && window.Calendly) {
    window.Calendly.initPopupWidget({ url });
  }
}
