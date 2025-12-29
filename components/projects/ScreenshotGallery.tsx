"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Screenshot } from "@/constants/projects-detail";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { blurPlaceholders, getImageSizes } from "@/lib/utils/image";

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
  projectSlug: string;
}

export function ScreenshotGallery({ screenshots, projectSlug }: ScreenshotGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { trackScreenshotLightboxOpened } = useAnalytics();

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    trackScreenshotLightboxOpened({
      project_slug: projectSlug,
      screenshot_index: index,
    });
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % screenshots.length);
    }
  };

  const prevImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + screenshots.length) % screenshots.length);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;

      switch (e.key) {
        case "Escape":
          setLightboxIndex(null);
          break;
        case "ArrowLeft":
          setLightboxIndex((lightboxIndex - 1 + screenshots.length) % screenshots.length);
          break;
        case "ArrowRight":
          setLightboxIndex((lightboxIndex + 1) % screenshots.length);
          break;
      }
    };

    if (lightboxIndex !== null) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [lightboxIndex, screenshots.length]);

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {screenshots.map((screenshot, index) => (
          <motion.button
            key={index}
            onClick={() => openLightbox(index)}
            className="relative aspect-video rounded-lg overflow-hidden bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src={screenshot.src}
              alt={screenshot.alt}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              placeholder="blur"
              blurDataURL={blurPlaceholders.screenshot}
              sizes={getImageSizes("screenshot")}
            />
            {screenshot.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-3">
                <p className="text-sm text-white">{screenshot.caption}</p>
              </div>
            )}
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                Click to enlarge
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 rounded bg-white/10 hover:bg-white/20 transition-colors z-10"
              aria-label="Close lightbox"
            >
              <X size={24} className="text-white" />
            </button>

            {/* Navigation Buttons */}
            {screenshots.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 p-2 rounded bg-white/10 hover:bg-white/20 transition-colors z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 p-2 rounded bg-white/10 hover:bg-white/20 transition-colors z-10"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={screenshots[lightboxIndex].src}
                alt={screenshots[lightboxIndex].alt}
                width={1920}
                height={1080}
                className="max-w-full max-h-full object-contain rounded-lg"
                priority
              />

              {/* Caption */}
              {screenshots[lightboxIndex].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-4 rounded-b-lg">
                  <p className="text-white text-center">
                    {screenshots[lightboxIndex].caption}
                  </p>
                </div>
              )}

              {/* Image Counter */}
              <div className="absolute top-0 left-0 right-0 text-center p-4">
                <span className="text-white/80 text-sm">
                  {lightboxIndex + 1} / {screenshots.length}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
