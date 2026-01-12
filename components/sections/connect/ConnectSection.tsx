"use client";

import { motion } from "framer-motion";
import { Calendar, Mail, Github } from "lucide-react";
import { socialLinks, profile } from "@/constants/profile";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useState, useEffect } from "react";

export function ConnectSection() {
  const { trackCTAClicked } = useAnalytics();
  const [emailHovered, setEmailHovered] = useState(false);
  const [githubHovered, setGithubHovered] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);

  useEffect(() => {
    // Use MutationObserver to detect theme changes without SSR issues
    const updateTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('light'));
    };

    updateTheme();

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const handleCTAClick = (type: "calendly" | "email" | "github") => {
    trackCTAClicked({ type, location: "connect_section" });
  };

  // Theme-aware button styles
  const getButtonStyles = (isHovered: boolean) => {
    if (isLightTheme) {
      return {
        color: "#1A1A1A", // Dark text for light mode
        borderColor: isHovered ? "rgba(139, 115, 85, 0.5)" : "rgba(102, 102, 102, 0.3)",
        backgroundColor: isHovered ? "rgba(0, 0, 0, 0.05)" : "transparent",
      };
    } else {
      return {
        color: "#FFFFFF", // White text for dark mode
        borderColor: isHovered ? "rgba(245, 235, 221, 0.5)" : "rgba(255, 255, 255, 0.2)",
        backgroundColor: isHovered ? "rgba(255, 255, 255, 0.1)" : "transparent",
      };
    }
  };
  return (
    <section
      id="contact"
      className="relative w-full py-32 px-6 bg-[var(--andromeda-primary)]"
      aria-labelledby="connect-heading"
    >
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <h2
            id="connect-heading"
            className="text-4xl md:text-5xl font-bold mb-6 text-[var(--andromeda-text-primary)]"
          >
            Book a Strategic Consultation
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p className="text-lg md:text-xl text-[var(--andromeda-text-secondary)] mb-12 max-w-2xl mx-auto">
            For teams that need reliable software to automate and scale their operations, let's talk.
          </p>
        </ScrollReveal>

        {/* CTAs */}
        <ScrollReveal delay={0.2}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
            {/* Primary CTA - Schedule Call */}
            <motion.a
              href={socialLinks.calendly}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleCTAClick("calendly")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                size="lg"
                className="bg-[var(--andromeda-highlight)] hover:bg-[var(--andromeda-highlight)]/90 text-white px-8 py-6 text-base font-medium rounded"
                style={{
                  boxShadow:
                    "0 0 20px rgba(74, 144, 226, 0.2), var(--shadow-1)",
                }}
              >
                <Calendar size={20} className="mr-2" />
                Schedule a Call
              </Button>
            </motion.a>

            {/* Secondary CTA - Email */}
            <motion.a
              href={socialLinks.email}
              onClick={() => handleCTAClick("email")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-base font-medium rounded transition-all duration-200"
                style={getButtonStyles(emailHovered)}
                onMouseEnter={() => setEmailHovered(true)}
                onMouseLeave={() => setEmailHovered(false)}
              >
                <Mail size={20} className="mr-2" />
                Discuss and Start a Project
              </Button>
            </motion.a>

            {/* Tertiary CTA - GitHub */}
            <motion.a
              href={socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleCTAClick("github")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-base font-medium rounded transition-all duration-200"
                style={getButtonStyles(githubHovered)}
                onMouseEnter={() => setGithubHovered(true)}
                onMouseLeave={() => setGithubHovered(false)}
              >
                <Github size={20} className="mr-2" />
                View GitHub
              </Button>
            </motion.a>
          </div>
        </ScrollReveal>

        {/* Location */}
        <ScrollReveal delay={0.3}>
          <p className="text-sm text-[var(--andromeda-text-secondary)]">
            {profile.location} • {profile.availability}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
