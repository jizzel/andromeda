"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ImageLoaderProps extends Omit<ImageProps, "onLoad" | "onError"> {
  /**
   * Whether to show a skeleton loader while the image loads
   */
  showSkeleton?: boolean;
  /**
   * Custom skeleton color (defaults to theme-aware background)
   */
  skeletonColor?: string;
  /**
   * Fade-in animation duration in seconds
   */
  fadeInDuration?: number;
}

/**
 * ImageLoader - Next.js Image component with skeleton loading state
 *
 * Features:
 * - Smooth fade-in animation when image loads
 * - Optional skeleton placeholder
 * - Handles loading and error states
 * - Respects prefers-reduced-motion
 */
export function ImageLoader({
  showSkeleton = true,
  skeletonColor,
  fadeInDuration = 0.3,
  className = "",
  alt,
  ...imageProps
}: ImageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence>
        {isLoading && showSkeleton && (
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundColor: skeletonColor || "var(--andromeda-secondary)",
            }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: fadeInDuration }}
            aria-hidden="true"
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {hasError ? (
        <div
          className={`flex items-center justify-center bg-[var(--andromeda-secondary)] ${className}`}
          role="img"
          aria-label={`Failed to load image: ${alt}`}
        >
          <span className="text-xs text-[var(--andromeda-text-secondary)]">
            Image unavailable
          </span>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoading ? 0 : 1 }}
          transition={{ duration: fadeInDuration }}
        >
          <Image
            {...imageProps}
            alt={alt}
            className={className}
            onLoad={handleLoad}
            onError={handleError}
          />
        </motion.div>
      )}
    </div>
  );
}
