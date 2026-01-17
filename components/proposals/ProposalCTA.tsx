"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";
import { Calendar, Mail, Clock, ArrowRight, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCalendlyPopup } from "@/lib/calendly";

interface ProposalCTAProps {
  validity: string;
  clientName: string;
  contactEmail?: string;
  contactPhone?: string;
  pdfUrl?: string;
}

export function ProposalCTA({
  validity,
  clientName,
  contactEmail = "joseph@attakorah.com",
  contactPhone,
  pdfUrl,
}: ProposalCTAProps) {
  return (
    <section
      id="next-steps"
      className="relative w-full py-24 md:py-32 px-6 bg-gradient-to-b from-[var(--andromeda-primary)] to-[var(--andromeda-secondary)]"
      aria-labelledby="cta-heading"
    >
      <div className="max-w-3xl mx-auto text-center">
        <ScrollReveal>
          {/* Validity Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--andromeda-accent-beige)]/10 border border-[var(--andromeda-accent-beige)]/30 mb-8">
            <Clock className="w-4 h-4 text-[var(--andromeda-accent-beige)]" />
            <span className="text-sm text-[var(--andromeda-accent-beige)] font-medium">
              Proposal valid for {validity}
            </span>
          </div>

          <h2
            id="cta-heading"
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-[var(--andromeda-text-primary)]"
          >
            Ready to Transform Your
            <span className="block text-[var(--andromeda-accent-beige)]">
              Business?
            </span>
          </h2>

          <p className="text-lg text-[var(--andromeda-text-secondary)] mb-10 max-w-xl mx-auto">
            Let&apos;s discuss this proposal and answer any questions you may have.
            We&apos;re excited to help bring your vision to life.
          </p>
        </ScrollReveal>

        {/* CTA Buttons */}
        <ScrollReveal delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                onClick={() => openCalendlyPopup()}
                className="bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 px-8 py-6 text-base font-semibold"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Meeting
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[var(--andromeda-accent-beige)]/50 text-[var(--andromeda-text-primary)] hover:bg-[var(--andromeda-accent-beige)]/10 px-8 py-6 text-base"
              >
                <a href={pdfUrl} download>
                  <FileDown className="w-5 h-5 mr-2" />
                  Download Proposal
                </a>
              </Button>
            </motion.div>
          </div>
        </ScrollReveal>

        {/* Contact Info */}
        <ScrollReveal delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[var(--andromeda-text-secondary)]">
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-2 hover:text-[var(--andromeda-accent-beige)] transition-colors"
            >
              <Mail className="w-4 h-4" />
              {contactEmail}
            </a>
            {contactPhone && (
              <a
                href={`tel:${contactPhone}`}
                className="flex items-center gap-2 hover:text-[var(--andromeda-accent-beige)] transition-colors"
              >
                <span className="w-4 h-4 flex items-center justify-center">📞</span>
                {contactPhone}
              </a>
            )}
          </div>
        </ScrollReveal>

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-[var(--andromeda-accent-beige)]/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-[var(--andromeda-accent-beige)]/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </section>
  );
}
