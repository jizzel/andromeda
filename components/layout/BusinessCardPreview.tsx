"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Github, Linkedin, Mail } from "lucide-react";
import Image from "next/image";
import { profile, socialLinks } from "@/constants/profile";

interface BusinessCardPreviewProps {
  isVisible: boolean;
}

export function BusinessCardPreview({ isVisible }: BusinessCardPreviewProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
          className="fixed left-24 top-1/2 -translate-y-1/2 z-40 w-[280px]"
          role="tooltip"
          aria-label="Business card preview"
        >
          <div
            className="relative bg-[var(--andromeda-secondary)] rounded-lg p-5 border border-white/10 dark:border-white/10 light:border-black/10"
            style={{
              boxShadow: "var(--shadow-2)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Profile Image */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-[var(--andromeda-primary)] border-2 border-[var(--andromeda-accent-beige)]/20">
                <Image
                  src={profile.profileImage}
                  alt={profile.name}
                  width={80}
                  height={80}
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Name */}
            <h3 className="text-xl font-bold text-center mb-1 text-[var(--andromeda-text-primary)]">
              {profile.name}
            </h3>

            {/* Title */}
            <p className="text-center text-sm text-[var(--andromeda-text-secondary)] mb-1">
              {profile.title}
            </p>

            {/* Focus */}
            <p className="text-center text-xs text-[var(--andromeda-text-secondary)] mb-4">
              {profile.focus}
            </p>

            {/* Social Links */}
            <div className="flex justify-center gap-3">
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded hover:bg-white/10 transition-colors"
                aria-label="GitHub"
              >
                <Github size={16} className="text-[var(--andromeda-text-secondary)]" />
              </a>
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded hover:bg-white/10 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={16} className="text-[var(--andromeda-text-secondary)]" />
              </a>
              <a
                href={socialLinks.email}
                className="p-2 rounded hover:bg-white/10 transition-colors"
                aria-label="Email"
              >
                <Mail size={16} className="text-[var(--andromeda-text-secondary)]" />
              </a>
            </div>

            {/* Click hint */}
            <p className="text-center text-xs text-[var(--andromeda-accent-beige)]/60 mt-4">
              Click to view full card
            </p>
          </div>

          {/* Connection line from Identity Anchor to preview */}
          <div
            className="absolute right-full top-1/2 -translate-y-1/2 w-4 h-px bg-[var(--andromeda-accent-beige)]/20"
            aria-hidden="true"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
