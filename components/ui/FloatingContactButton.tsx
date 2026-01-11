"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "lucide-react";

export function FloatingContactButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Delay initial appearance for smooth entrance
    const showTimer = setTimeout(() => setIsVisible(true), 1000);

    // Handle hash navigation on page load
    if (window.location.hash === "#contact") {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
          contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }

    const handleScroll = () => {
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        const rect = contactSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Hide button when contact section is in view (with buffer)
        const isContactVisible = rect.top < windowHeight * 0.7 && rect.bottom > 0;
        setIsVisible(!isContactVisible);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial state

    return () => {
      clearTimeout(showTimer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClick = () => {
    const contactSection = document.getElementById("contact");

    if (contactSection) {
      // We're on a page with the contact section - scroll to it
      contactSection.scrollIntoView({ behavior: "smooth", block: "start" });

      // Optional: Add brief highlight animation to contact section
      contactSection.style.transition = "background-color 0.3s ease";
      const originalBg = contactSection.style.backgroundColor;
      contactSection.style.backgroundColor = "var(--andromeda-accent-beige)";
      setTimeout(() => {
        contactSection.style.backgroundColor = originalBg;
      }, 300);
    } else {
      // We're on a different page - navigate to home page contact section
      window.location.href = "/#contact";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.button
            onClick={handleClick}
            className="flex items-center gap-2 py-2.5 pl-3 pr-2 rounded-l-full border-2 border-[var(--andromeda-accent-beige)] bg-[var(--andromeda-primary)]/80 backdrop-blur-sm hover:bg-[var(--andromeda-secondary)]/90 transition-colors shadow-lg hover:shadow-xl group"
            whileHover={{ x: -8 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Scroll to contact section"
            title="Contact Me"
          >
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs font-medium text-[var(--andromeda-accent-beige)] whitespace-nowrap overflow-hidden"
                >
                  Contact Me
                </motion.span>
              )}
            </AnimatePresence>

            <div className="w-9 h-9 rounded-full bg-transparent border-2 border-[var(--andromeda-accent-beige)] flex items-center justify-center group-hover:bg-[var(--andromeda-accent-beige)]/10 transition-colors">
              <Phone
                size={16}
                className="text-[var(--andromeda-accent-beige)] group-hover:rotate-12 transition-transform"
              />
            </div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
