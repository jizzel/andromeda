import { ArrowRight, BadgeCheck, Download } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  BUILD_HEADING,
  BUILD_INTRO,
  CAPABILITIES_INTRO,
  ENGAGEMENT_MODES,
  evidenceLabel,
  groupsInStage,
  REFERRAL_INTRO,
  TECH_EXPERTISE,
  isDelivered,
  isDeliveredProof,
  proofStatus,
  type CapabilityProof,
  type CatalogueGroup,
  type CatalogueItem,
  type CatalogueStage,
} from "@/constants/capability-catalogue";
import { profile } from "@/constants/profile";
import { CapabilitiesCta, CapabilitiesViewTracker, CopyIntroButton, ProofLink, StatementDownloadLink } from "./CapabilitiesClient";
import { CAPABILITY_ICONS } from "./icons";
import { cardClass, pillClass, secondaryButtonClass } from "./styles";

/**
 * "What I Do" (/capabilities): advising and design, the software Joseph
 * builds ("What I Build"), and putting it to work, each with evidence from
 * real projects, plus how to engage him. Made to be shared as a link;
 * content lives in `constants/capability-catalogue.ts`.
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
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--andromeda-text-primary)] mb-5">What I Do</h1>
            <p className="text-lg text-[var(--andromeda-text-secondary)] leading-relaxed">{CAPABILITIES_INTRO}</p>
            <p className="mt-4 flex items-start gap-2 text-sm text-[var(--andromeda-text-secondary)]">
              <BadgeCheck className="w-4 h-4 mt-0.5 shrink-0 text-[var(--andromeda-accent-beige)]" aria-hidden />
              <span>
                <strong className="font-semibold text-[var(--andromeda-text-primary)]">Built</strong> and{" "}
                <strong className="font-semibold text-[var(--andromeda-text-primary)]">Track record</strong> mark work I&apos;ve delivered; the rest are areas
                I&apos;m equipped to take on.
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
          {groupsInStage("advise").map((group) => (
            <a key={group.id} href={`#${group.id}`} className={pillClass}>
              {group.title}
            </a>
          ))}
          <a href="#build" className={pillClass}>
            {BUILD_HEADING}
          </a>
          {groupsInStage("adopt").map((group) => (
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
          {/* Advise & design */}
          {groupsInStage("advise").map((group) => (
            <GroupSection key={group.id} group={group} level="h2" />
          ))}

          {/* What I Build: the software, in three groups */}
          <section id="build" aria-labelledby="build-heading" className="scroll-mt-24 space-y-14">
            <ScrollReveal>
              <h2 id="build-heading" className="text-2xl md:text-3xl font-bold text-[var(--andromeda-text-primary)] mb-2">
                {BUILD_HEADING}
              </h2>
              <p className="text-[var(--andromeda-text-secondary)]">{BUILD_INTRO}</p>
            </ScrollReveal>
            {groupsInStage("build").map((group) => (
              <GroupSection key={group.id} group={group} level="h3" />
            ))}
          </section>

          {/* Put it to work */}
          {groupsInStage("adopt").map((group) => (
            <GroupSection key={group.id} group={group} level="h2" />
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
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

/** One group of cards: a top-level section (advise, adopt) or a sub-group of "What I Build". */
function GroupSection({ group, level }: { group: CatalogueGroup; level: "h2" | "h3" }) {
  const Heading = level;
  return (
    <section id={group.id} aria-labelledby={`${group.id}-heading`} className="scroll-mt-24">
      <ScrollReveal>
        <Heading
          id={`${group.id}-heading`}
          className={`${level === "h2" ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"} font-bold text-[var(--andromeda-text-primary)] mb-2`}
        >
          {group.title}
        </Heading>
        <p className="text-[var(--andromeda-text-secondary)] mb-8">{group.intro}</p>
      </ScrollReveal>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {group.items.map((item, index) => (
          <ScrollReveal key={item.id} delay={index * 0.05} threshold={0.1} className="h-full">
            <CapabilityItem item={item} stage={group.stage} heading={level === "h2" ? "h3" : "h4"} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

/** A capability card. `heading` is one level below its group's heading (h3 under an h2 group, h4 under a build sub-group). */
function CapabilityItem({ item, stage, heading }: { item: CatalogueItem; stage: CatalogueStage; heading: "h3" | "h4" }) {
  const Icon = CAPABILITY_ICONS[item.icon];
  const Title = heading;
  return (
    <article className={`${cardClass} p-6 h-full flex flex-col print-avoid-break`} style={{ boxShadow: "var(--shadow-1)" }}>
      <Icon size={26} strokeWidth={1.5} className="mb-4 text-[var(--andromeda-accent-beige)]" aria-hidden />
      <Title className="text-lg font-bold text-[var(--andromeda-text-primary)] mb-2">{item.title}</Title>
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
      {item.proof?.length ? (
        <div className="mt-auto pt-4 border-t border-white/10 light:border-black/10">
          {isDelivered(item) ? (
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--andromeda-accent-beige)] mb-1.5">
              <BadgeCheck className="w-3.5 h-3.5" aria-hidden /> {evidenceLabel(stage)}
            </p>
          ) : (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)] mb-1.5">In progress</p>
          )}
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
                <StatusTag proof={proof} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

/** A proof's maturity (Production, Pilot, Delivered, In development…), so evidence is never overstated. */
function StatusTag({ proof }: { proof: CapabilityProof }) {
  const status = proofStatus(proof);
  if (!status) return null;
  const delivered = isDeliveredProof(proof);
  return (
    <span
      className={`mt-1 block w-fit whitespace-nowrap rounded px-1.5 py-px text-[10px] font-medium uppercase tracking-wider ${
        delivered
          ? "border border-[var(--andromeda-accent-beige)]/30 text-[var(--andromeda-accent-beige)]"
          : "border border-amber-500/40 text-amber-500"
      }`}
    >
      {status}
    </span>
  );
}
