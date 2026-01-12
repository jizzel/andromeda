"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

interface Inspiration {
  name: string;
  url: string;
  image: string;
  description: string;
}

interface ProposalInspirationsProps {
  inspirations: Inspiration[];
}

export function ProposalInspirations({ inspirations }: ProposalInspirationsProps) {
  return (
    <section
      id="inspirations"
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-secondary)]"
      aria-labelledby="inspirations-heading"
    >
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <h2
            id="inspirations-heading"
            className="text-3xl md:text-4xl font-bold mb-4 text-center text-[var(--andromeda-text-primary)]"
          >
            Design Inspirations
          </h2>
          <p className="text-lg text-[var(--andromeda-text-secondary)] text-center mb-12 max-w-2xl mx-auto">
            Reference sites that capture the aesthetic direction for your digital presence
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {inspirations.map((item, index) => (
            <ScrollReveal key={index} delay={0.1 * (index + 1)}>
              <motion.a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group block rounded-xl overflow-hidden bg-[var(--andromeda-primary)] border border-white/10 light:border-black/10"
              >
                {/* Image Preview */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--andromeda-primary)] via-transparent to-transparent opacity-60" />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-[var(--andromeda-accent-beige)]/0 group-hover:bg-[var(--andromeda-accent-beige)]/10 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="p-3 rounded-full bg-[var(--andromeda-accent-beige)]">
                        <ExternalLink className="w-5 h-5 text-[var(--andromeda-primary)]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-[var(--andromeda-text-primary)] group-hover:text-[var(--andromeda-accent-beige)] transition-colors">
                      {item.name}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-[var(--andromeda-text-secondary)] group-hover:text-[var(--andromeda-accent-beige)] transition-colors" />
                  </div>
                  <p className="text-sm text-[var(--andromeda-text-secondary)]">
                    {item.description}
                  </p>
                </div>
              </motion.a>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.5}>
          <p className="text-center text-sm text-[var(--andromeda-text-secondary)] mt-8">
            These references guide our design direction while creating a unique identity for your brand.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
