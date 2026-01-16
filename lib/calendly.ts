/**
 * Utility functions for Calendly integration
 */

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
export function openCalendlyPopup(url: string = "https://calendly.com/juxluvjoe/30min") {
  if (typeof window !== "undefined" && window.Calendly) {
    window.Calendly.initPopupWidget({ url });
  }
}
