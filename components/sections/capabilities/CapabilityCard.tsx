"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Activity, Workflow, Plug } from "lucide-react";
import { Capability } from "@/constants/capabilities";
import { useKeyboardNav } from "@/lib/hooks/useKeyboardNav";

interface CapabilityCardProps {
  capability: Capability;
}

const iconMap = {
  Settings,
  Activity,
  Workflow,
  Plug,
};

export function CapabilityCard({ capability }: CapabilityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  // Keyboard navigation
  useKeyboardNav({
    onEnter: toggleExpanded,
    onSpace: toggleExpanded,
    onEscape: () => setIsExpanded(false),
    enabled: true,
  });

  const Icon = capability.icon
    ? iconMap[capability.icon as keyof typeof iconMap]
    : null;

  return (
    <motion.article
      className="relative cursor-pointer"
      onClick={toggleExpanded}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleExpanded();
        }
      }}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      aria-label={`${capability.title} capability details`}
      whileHover={{
        y: -2,
        scale: 1.01,
      }}
      transition={{
        duration: 0.15,
        ease: [0.33, 1, 0.68, 1],
      }}
    >
      <div
        className="bg-[var(--andromeda-primary)] rounded-lg p-6 border border-white/10 dark:border-white/10 light:border-black/10 h-full"
        style={{
          boxShadow: isExpanded ? "var(--shadow-2)" : "var(--shadow-1)",
        }}
      >
        {/* Icon */}
        {Icon && (
          <div className="mb-4">
            <Icon
              size={28}
              className="text-[var(--andromeda-accent-beige)]"
              strokeWidth={1.5}
            />
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold mb-2 text-[var(--andromeda-text-primary)]">
          {capability.title}
        </h3>

        {/* Tagline */}
        <p className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed mb-4">
          {capability.tagline}
        </p>

        {/* Expandable Content */}
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? "auto" : 0,
            opacity: isExpanded ? 1 : 0,
          }}
          transition={{
            duration: 0.25,
            ease: [0.33, 1, 0.68, 1],
          }}
          className="overflow-hidden"
        >
          {isExpanded && (
            <div className="space-y-4 border-t border-white/10 pt-4">
              {/* Description */}
              <p className="text-sm text-[var(--andromeda-text-primary)] leading-relaxed">
                {capability.description}
              </p>

              {/* Examples */}
              <div>
                <h4 className="text-xs uppercase tracking-wide text-[var(--andromeda-text-secondary)] mb-2">
                  Examples
                </h4>
                <ul className="space-y-1">
                  {capability.examples.map((example, index) => (
                    <li
                      key={index}
                      className="text-sm text-[var(--andromeda-text-secondary)] flex items-start"
                    >
                      <span className="text-[var(--andromeda-accent-beige)] mr-2">
                        •
                      </span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </motion.div>

        {/* Read More Indicator */}
        {!isExpanded && (
          <p className="text-xs text-[var(--andromeda-accent-beige)] mt-4">
            Read More →
          </p>
        )}
      </div>
    </motion.article>
  );
}
