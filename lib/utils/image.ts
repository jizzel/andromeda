/**
 * Image utility functions for blur placeholders and optimization
 */

/**
 * Generate a blur data URL for a given image
 * This creates a simple SVG placeholder with the dominant color
 */
export function generateBlurDataURL(
  width: number = 8,
  height: number = 8,
  color: string = "#1B1E2B"
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="1" />
      </filter>
      <rect width="${width}" height="${height}" fill="${color}" filter="url(#b)" />
    </svg>
  `;

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Predefined blur placeholders for common image types
 */
export const blurPlaceholders = {
  profile: generateBlurDataURL(96, 96, "#2A2D3A"),
  thumbnail: generateBlurDataURL(400, 300, "#1B1E2B"),
  screenshot: generateBlurDataURL(800, 600, "#0F111A"),
  icon: generateBlurDataURL(48, 48, "#1B1E2B"),
} as const;

/**
 * Get responsive image sizes string for Next.js Image component
 */
export function getImageSizes(type: "profile" | "thumbnail" | "screenshot" | "icon"): string {
  switch (type) {
    case "profile":
      return "(max-width: 640px) 80px, 96px";
    case "thumbnail":
      return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px";
    case "screenshot":
      return "(max-width: 640px) 100vw, (max-width: 1200px) 80vw, 800px";
    case "icon":
      return "48px";
    default:
      return "100vw";
  }
}

/**
 * Calculate optimal image quality based on format and use case
 */
export function getImageQuality(format: "webp" | "avif" | "jpeg" | "png" = "webp"): number {
  switch (format) {
    case "avif":
      return 80; // AVIF has better compression
    case "webp":
      return 85; // WebP balance
    case "jpeg":
      return 85; // Standard JPEG quality
    case "png":
      return 100; // PNG is lossless
    default:
      return 85;
  }
}
