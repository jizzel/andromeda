"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Github, Linkedin, Mail } from "lucide-react";
import Image from "next/image";
import { FocusTrap } from "./FocusTrap";
import { useBusinessCard } from "./BusinessCardContext";
import { useEffect } from "react";
import { profile, socialLinks } from "@/constants/profile";

export function BusinessCard() {
  const { isOpen, closeBusinessCard } = useBusinessCard();

  // Disable body scroll when card is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeBusinessCard}
            aria-hidden="true"
          />

          {/* Business Card */}
          <FocusTrap active={isOpen} onEscape={closeBusinessCard}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-[320px]"
              role="dialog"
              aria-labelledby="business-card-title"
              aria-describedby="business-card-description"
            >
              <div
                className="relative bg-[var(--andromeda-secondary-dark)] rounded-lg p-6 border border-white/10"
                style={{
                  boxShadow: "var(--shadow-2)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {/* Close Button */}
                <button
                  onClick={closeBusinessCard}
                  className="absolute top-4 right-4 p-1 rounded hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]"
                  aria-label="Close business card"
                >
                  <X size={20} className="text-[var(--andromeda-text-secondary)]" />
                </button>

                {/* Profile Image */}
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--andromeda-primary-dark)] border-2 border-[var(--andromeda-accent-beige)]/20">
                    <Image
                      src={profile.profileImage}
                      alt={profile.name}
                      width={96}
                      height={96}
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                {/* Name */}
                <h2
                  id="business-card-title"
                  className="text-2xl font-bold text-center mb-2 text-[var(--andromeda-text-primary)]"
                >
                  {profile.name}
                </h2>

                {/* Title */}
                <p className="text-center text-[var(--andromeda-text-secondary)] mb-1">
                  {profile.title}
                </p>

                {/* Focus */}
                <p className="text-center text-sm text-[var(--andromeda-text-secondary)] mb-2">
                  {profile.focus}
                </p>

                {/* Location */}
                <p className="text-center text-sm text-[var(--andromeda-text-secondary)] mb-6">
                  {profile.location}
                </p>

                {/* Divider */}
                <div className="h-px bg-white/10 mb-6" />

                {/* Tagline */}
                <p
                  id="business-card-description"
                  className="text-center text-sm text-[var(--andromeda-text-primary)] mb-6 leading-relaxed"
                >
                  {profile.tagline}
                </p>

                {/* Social Links */}
                <div className="flex justify-center items-center gap-6">
                  <a
                    href={socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]"
                    aria-label="GitHub profile"
                  >
                    <Github size={20} className="text-[var(--andromeda-text-primary)]" />
                  </a>
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]"
                    aria-label="LinkedIn profile"
                  >
                    <Linkedin size={20} className="text-[var(--andromeda-text-primary)]" />
                  </a>
                  <a
                    href={socialLinks.email}
                    className="p-2 rounded hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]"
                    aria-label="Email Joseph"
                  >
                    <Mail size={20} className="text-[var(--andromeda-text-primary)]" />
                  </a>
                </div>
              </div>
            </motion.div>
          </FocusTrap>
        </>
      )}
    </AnimatePresence>
  );
}
