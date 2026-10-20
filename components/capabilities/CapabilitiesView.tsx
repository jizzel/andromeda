import { ArrowRight, BadgeCheck, Download } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  CAPABILITIES_INTRO,
  CAPABILITY_GROUPS,
  ENGAGEMENT_MODES,
  REFERRAL_INTRO,
  TECH_EXPERTISE,
  isDelivered,
  type CatalogueItem,
} from "@/constants/capability-catalogue";
import { profile } from "@/constants/profile";
import { CapabilitiesCta, CapabilitiesViewTracker, CopyIntroButton, ProofLink, StatementDownloadLink } from "./CapabilitiesClient";
import { CAPABILITY_ICONS } from "./icons";
import { cardClass, pillClass, secondaryButtonClass } from "./styles";

/**
 * "What I Build" (/capabilities): every kind of software Joseph takes on,
 * grouped, with proof from real projects and how to engage him. Made to be
 * shared as a link; content lives in `constants/capability-catalogue.ts`.
 * Rendered on the server; only tracking, proof links and the CTA are client
 * components (`CapabilitiesClient.tsx`).
 */
export function CapabilitiesView() {
  return (
    <main className="relative w-full min-h-screen bg-[var(--andromeda-primary)] pt-24 pb-24 px-6">
      <CapabilitiesViewTracker />
      <div className="max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Capabilities" }]} />

        {/* Header */}
        <ScrollReveal>
          <header className="max-w-3xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--andromeda-accent-beige)] mb-3">Capabilities</p>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--andromeda-text-primary)] mb-5">What I Build</h1>
            <p className="text-lg text-[var(--andromeda-text-secondary)] leading-relaxed">{CAPABILITIES_INTRO}</p>
            <p className="mt-4 flex items-start gap-2 text-sm text-[var(--andromeda-text-secondary)]">
              <BadgeCheck className="w-4 h-4 mt-0.5 shrink-0 text-[var(--andromeda-accent-beige)]" aria-hidden />
              <span>
                <strong className="font-semibold text-[var(--andromeda-text-primary)]">Built</strong> marks work I&apos;ve delivered or shipped; the rest are
                areas I&apos;m equipped to take on.
              </span>
            </p>
            <div className="mt-6 print:hidden">
              <StatementDownloadLink className={secondaryButtonClass}>
                <Download className="w-4 h-4" /> Download one-page PDF
              </StatementDownloadLink>
            </div>
          </header>
        </ScrollReveal>

        {/* Jump links */}
        <nav aria-label="Capability groups" className="flex flex-wrap gap-2 mb-16 print:hidden">
          {CAPABILITY_GROUPS.map((group) => (
            <a key={group.id} href={`#${group.id}`} className={pillClass}>
              {group.title}
            </a>
          ))}
          <a href="#tech" className={pillClass}>
            Technical expertise
          </a>
          <a href="#work-together" className={pillClass}>
            How we can work together
          </a>
        </nav>

        {/* Groups */}
        <div className="space-y-20">
          {CAPABILITY_GROUPS.map((group) => (
            <section key={group.id} id={group.id} aria-labelledby={`${group.id}-heading`} className="scroll-mt-24">
              <ScrollReveal>
                <h2 id={`${group.id}-heading`} className="text-2xl md:text-3xl font-bold text-[var(--andromeda-text-primary)] mb-2">
                  {group.title}
                </h2>
                <p className="text-[var(--andromeda-text-secondary)] mb-8">{group.intro}</p>
              </ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((item, index) => (
                  <ScrollReveal key={item.id} delay={index * 0.05} threshold={0.1} className="h-full">
                    <CapabilityItem item={item} />
                  </ScrollReveal>
                ))}
              </div>
            </section>
          ))}

          {/* Technical expertise */}
          <section id="tech" aria-labelledby="tech-heading" className="scroll-mt-24">
            <ScrollReveal>
              <h2 id="tech-heading" className="text-2xl md:text-3xl font-bold text-[var(--andromeda-text-primary)] mb-2">
                Technical expertise
              </h2>
              <p className="text-[var(--andromeda-text-secondary)] mb-8">The tools behind the work above.</p>
            </ScrollReveal>
            <dl className={`${cardClass} divide-y divide-white/10 light:divide-black/10 print-avoid-break`}>
              {TECH_EXPERTISE.map((row) => (
                <div key={row.area} className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-2 px-5 py-4">
                  <dt className="text-sm font-semibold text-[var(--andromeda-text-primary)]">{row.area}</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {row.items.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded text-xs bg-[var(--andromeda-primary)] text-[var(--andromeda-text-secondary)] border border-white/10 light:border-black/10"
                      >
                        {tech}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Engagement */}
          <section id="work-together" aria-labelledby="work-together-heading" className="scroll-mt-24">
            <ScrollReveal>
              <h2 id="work-together-heading" className="text-2xl md:text-3xl font-bold text-[var(--andromeda-text-primary)] mb-2">
                How we can work together
              </h2>
              <p className="text-[var(--andromeda-text-secondary)] mb-8">From a complete system to a single piece of a larger one.</p>
            </ScrollReveal>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {ENGAGEMENT_MODES.map((mode) => (
                <li key={mode.title} className={`${cardClass} p-5 print-avoid-break`}>
                  <p className="font-semibold text-[var(--andromeda-text-primary)] mb-1">{mode.title}</p>
                  <p className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed">{mode.description}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Referral */}
          <section aria-labelledby="refer-heading" className={`${cardClass} p-8 md:p-10 print:hidden`}>
            <h2 id="refer-heading" className="text-2xl md:text-3xl font-bold text-[var(--andromeda-text-primary)] mb-2">
              Introducing me to someone?
            </h2>
            <p className="text-[var(--andromeda-text-secondary)] mb-5">Copy this short introduction and send it with the link or the one-page PDF.</p>
            <blockquote className="mb-5 rounded border border-white/10 light:border-black/10 bg-[var(--andromeda-primary)] p-4 text-sm leading-relaxed text-[var(--andromeda-text-primary)] select-all">
              {REFERRAL_INTRO}
            </blockquote>
            <div className="flex flex-wrap gap-3">
              <CopyIntroButton text={REFERRAL_INTRO} />
              <StatementDownloadLink className={secondaryButtonClass}>
                <Download className="w-4 h-4" /> Download one-page PDF
              </StatementDownloadLink>
            </div>
          </section>

          {/* Call to action */}
          <section aria-labelledby="cta-heading" className={`${cardClass} p-8 md:p-10 print-avoid-break`}>
            <h2 id="cta-heading" className="text-2xl md:text-3xl font-bold text-[var(--andromeda-text-primary)] mb-2">
              Have a project in mind?
            </h2>
            <p className="text-[var(--andromeda-text-secondary)] mb-6">Tell me what you need and I&apos;ll tell you honestly how I can help.</p>
            <CapabilitiesCta />
            <p className="hidden print:block text-sm text-[var(--andromeda-text-secondary)]">
              {profile.email} · {profile.siteUrl.replace(/^https?:\/\//, "")}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function CapabilityItem({ item }: { item: CatalogueItem }) {
  const Icon = CAPABILITY_ICONS[item.icon];
  return (
    <article className={`${cardClass} p-6 h-full flex flex-col print-avoid-break`} style={{ boxShadow: "var(--shadow-1)" }}>
      <Icon size={26} strokeWidth={1.5} className="mb-4 text-[var(--andromeda-accent-beige)]" aria-hidden />
      <h3 className="text-lg font-bold text-[var(--andromeda-text-primary)] mb-2">{item.title}</h3>
      <p className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed mb-4">{item.description}</p>
      <ul className="flex flex-wrap gap-1.5 mb-4" aria-label="Examples">
        {item.examples.map((example) => (
          <li
            key={example}
            className="px-2 py-0.5 rounded text-xs bg-[var(--andromeda-primary)] text-[var(--andromeda-text-secondary)] border border-white/10 light:border-black/10"
          >
            {example}
          </li>
        ))}
      </ul>
      {isDelivered(item) ? (
        <div className="mt-auto pt-4 border-t border-white/10 light:border-black/10">
          <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--andromeda-accent-beige)] mb-1.5">
            <BadgeCheck className="w-3.5 h-3.5" aria-hidden /> Built
          </p>
          <ul className="space-y-1.5">
            {item.proof!.map((proof) => (
              <li key={proof.label} className="text-sm text-[var(--andromeda-text-secondary)] leading-snug">
                {proof.slug ? (
                  <ProofLink
                    capabilityId={item.id}
                    slug={proof.slug}
                    className="group inline-flex items-start gap-1 text-[var(--andromeda-text-primary)] hover:text-[var(--andromeda-accent-beige)] transition-colors"
                  >
                    <span>{proof.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </ProofLink>
                ) : (
                  proof.label
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
