"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";
import { Check, Sparkles, Clock, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PaymentStructure {
  milestone: string;
  percentage: string | null;
  amount: string;
}

interface PaymentPlan {
  id: string;
  name: string;
  badge: string;
  totalInvestment: string;
  premium: string | null;
  structure: PaymentStructure[];
  includes: string[];
  bestFor: string;
}

interface ProposalPaymentPlansProps {
  plans: PaymentPlan[];
}

const badgeIcons: Record<string, typeof Sparkles> = {
  "Best Value": Sparkles,
  "Flexibility": Clock,
  "Maximum Flexibility": CalendarDays,
};

export function ProposalPaymentPlans({ plans }: ProposalPaymentPlansProps) {
  return (
    <section
      id="payment-plans"
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-primary)]"
      aria-labelledby="payment-heading"
    >
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <h2
            id="payment-heading"
            className="text-3xl md:text-4xl font-bold mb-4 text-center text-[var(--andromeda-text-primary)]"
          >
            Payment Plan Options
          </h2>
          <p className="text-lg text-[var(--andromeda-text-secondary)] text-center mb-12 max-w-2xl mx-auto">
            Flexible payment structures to suit your cash flow
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const BadgeIcon = badgeIcons[plan.badge] || Sparkles;
            const isHighlighted = plan.badge === "Best Value";

            return (
              <ScrollReveal key={plan.id} delay={0.1 * (index + 1)}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className={`relative h-full rounded-xl p-6 flex flex-col ${
                    isHighlighted
                      ? "bg-gradient-to-br from-[var(--andromeda-accent-beige)]/15 to-transparent border-2 border-[var(--andromeda-accent-beige)]/40"
                      : "bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10"
                  }`}
                >
                  {/* Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge
                      className={
                        isHighlighted
                          ? "bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)]"
                          : "bg-[var(--andromeda-primary)] text-[var(--andromeda-text-secondary)] border border-white/20"
                      }
                    >
                      <BadgeIcon size={12} className="mr-1" />
                      {plan.badge}
                    </Badge>
                    {plan.premium && (
                      <span className="text-xs text-[var(--andromeda-text-secondary)]">
                        +{plan.premium} premium
                      </span>
                    )}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-lg font-bold text-[var(--andromeda-text-primary)] mb-1">
                    {plan.name}
                  </h3>

                  {/* Total Investment */}
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-[var(--andromeda-accent-beige)]">
                      {plan.totalInvestment}
                    </span>
                  </div>

                  {/* Payment Structure */}
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-[var(--andromeda-text-secondary)] uppercase tracking-wider mb-3">
                      Payment Structure
                    </h4>
                    <div className="space-y-2">
                      {plan.structure.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center text-sm py-2 border-b border-white/5 light:border-black/5 last:border-0"
                        >
                          <span className="text-[var(--andromeda-text-secondary)]">
                            {item.milestone}
                          </span>
                          <span className="font-medium text-[var(--andromeda-text-primary)]">
                            {item.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Includes */}
                  <div className="flex-1 mb-6">
                    <h4 className="text-xs font-semibold text-[var(--andromeda-text-secondary)] uppercase tracking-wider mb-3">
                      What&apos;s Included
                    </h4>
                    <ul className="space-y-2">
                      {plan.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--andromeda-text-secondary)]">
                          <Check size={14} className="text-[var(--andromeda-accent-beige)] flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Best For */}
                  <div className="pt-4 border-t border-white/10 light:border-black/10">
                    <p className="text-xs text-[var(--andromeda-text-secondary)]">
                      <span className="font-semibold text-[var(--andromeda-text-primary)]">Best for:</span>{" "}
                      {plan.bestFor}
                    </p>
                  </div>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Important Note */}
        <ScrollReveal delay={0.4}>
          <div className="mt-12 p-6 rounded-lg bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10">
            <h4 className="text-sm font-semibold text-[var(--andromeda-text-primary)] mb-2">
              Important Clarification on Social Media Services
            </h4>
            <p className="text-sm text-[var(--andromeda-text-secondary)]">
              Full social media management, including content creation, daily engagement, and active audience growth, is not included beyond the first month in any payment plan. Ongoing social media management is available as a separate monthly retainer, priced per brand.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
