"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Camera,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Star,
  ListChecks,
  Clock,
  ClipboardList,
  Users,
  Package,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ExpandCollapse } from "@/components/animations/ExpandCollapse";
import { formatDate } from "@/lib/dates";
import type { CreativeBriefData } from "@/types/brief";

interface BriefContentProps {
  brief: CreativeBriefData;
  expiryDate?: string;
}

export function BriefContent({ brief, expiryDate }: BriefContentProps) {
  return (
    <main className="min-h-screen bg-[var(--andromeda-primary)] pb-24">
      <BriefHero brief={brief} expiryDate={expiryDate} />
      <BriefVisions brief={brief} />
      <BriefReferences brief={brief} />
      <BriefEditing brief={brief} />
      <BriefPriorities brief={brief} />
      <BriefShotList brief={brief} />
      <BriefLogistics brief={brief} />
      <BriefDeliverables brief={brief} />
      <BriefFooter brief={brief} />
    </main>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function BriefHero({ brief, expiryDate }: BriefContentProps) {
  return (
    <section className="relative px-6 pt-16 md:pt-24 pb-12 max-w-4xl mx-auto">
      <ScrollReveal>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--andromeda-accent-beige)]/10 border border-[var(--andromeda-accent-beige)]/30 text-xs text-[var(--andromeda-accent-beige)] mb-4">
          <Camera className="w-3.5 h-3.5" />
          Creative Brief · v{brief.version}
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-[var(--andromeda-text-primary)] mb-3">
          {brief.projectTitle}
        </h1>
        <p className="text-sm md:text-base text-[var(--andromeda-text-secondary)] mb-6">
          For {brief.shootClient} · {brief.venueNames.join(" & ")}
        </p>
        <p className="text-base md:text-lg text-[var(--andromeda-text-secondary)] max-w-2xl leading-relaxed">
          {brief.intro}
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--andromeda-text-secondary)]/80">
          <span>Updated {formatDate(brief.updatedAt)}</span>
          {expiryDate && <span>Access expires {formatDate(expiryDate)}</span>}
          <a
            href={`mailto:${brief.contactEmail}`}
            className="inline-flex items-center gap-1 text-[var(--andromeda-accent-beige)] hover:underline"
          >
            <Mail className="w-3 h-3" />
            {brief.contactEmail}
          </a>
        </div>
      </ScrollReveal>
    </section>
  );
}

// ─── Visions per venue ──────────────────────────────────────────────────────

function BriefVisions({ brief }: BriefContentProps) {
  return (
    <section className="px-6 max-w-4xl mx-auto mb-16">
      <ScrollReveal>
        <SectionEyebrow>What you&apos;re shooting</SectionEyebrow>
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--andromeda-text-primary)] mb-6">
          Two venues, two voices
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brief.visions.map((vision) => (
            <div
              key={vision.venueName}
              className="rounded-xl border border-[var(--andromeda-accent-beige)]/20 bg-[var(--andromeda-secondary)]/40 p-6"
            >
              <div className="text-xs uppercase tracking-wider text-[var(--andromeda-accent-beige)] mb-2">
                {vision.venueName}
              </div>
              <p className="text-sm leading-relaxed text-[var(--andromeda-text-secondary)]">
                {vision.statement}
              </p>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}

// ─── Visual references ──────────────────────────────────────────────────────

function BriefReferences({ brief }: BriefContentProps) {
  return (
    <section className="px-6 max-w-4xl mx-auto mb-16">
      <ScrollReveal>
        <SectionEyebrow>Visual references</SectionEyebrow>
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--andromeda-text-primary)] mb-2">
          Mood, not copy
        </h2>
        <p className="text-sm text-[var(--andromeda-text-secondary)] mb-8 max-w-2xl">
          Each image has a one-line takeaway — note what to borrow (lighting, framing, feeling).
          Don&apos;t recreate the shot; interpret the mood.
        </p>
      </ScrollReveal>

      <div className="space-y-10">
        {brief.referenceCategories.map((category) => (
          <ScrollReveal key={category.id}>
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-[var(--andromeda-text-primary)] mb-1">
                {category.title}
              </h3>
              {category.description && (
                <p className="text-sm text-[var(--andromeda-text-secondary)] mb-4">{category.description}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.images.map((image, idx) => (
                  <figure key={`${category.id}-${idx}`} className="flex flex-col gap-2">
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[var(--andromeda-accent-beige)]/15 bg-[var(--andromeda-secondary)]/40">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="text-xs text-[var(--andromeda-text-secondary)] leading-relaxed">
                      <span className="block text-[var(--andromeda-text-primary)]">{image.takeaway}</span>
                      <span className="block text-[var(--andromeda-text-secondary)]/60 mt-0.5">{image.credit}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

// ─── Editing direction ──────────────────────────────────────────────────────

function BriefEditing({ brief }: BriefContentProps) {
  return (
    <section className="px-6 max-w-4xl mx-auto mb-16">
      <ScrollReveal>
        <SectionEyebrow>Editing direction</SectionEyebrow>
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--andromeda-text-primary)] mb-2">
          Where most hospitality shoots fall apart
        </h2>
        <p className="text-sm text-[var(--andromeda-text-secondary)] mb-8 max-w-2xl">
          Post-production decides whether the work feels premium or cheap. These rules matter more than the camera.
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScrollReveal>
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5">
            <div className="flex items-center gap-2 text-emerald-300 mb-4">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-semibold">Do</span>
            </div>
            <ul className="space-y-2.5 text-sm text-[var(--andromeda-text-secondary)]">
              {brief.editing.dos.map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-emerald-300/70 shrink-0">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
            <div className="flex items-center gap-2 text-amber-300 mb-4">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-semibold">Avoid</span>
            </div>
            <ul className="space-y-2.5 text-sm text-[var(--andromeda-text-secondary)]">
              {brief.editing.donts.map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-amber-300/70 shrink-0">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─── Shot priorities ────────────────────────────────────────────────────────

function BriefPriorities({ brief }: BriefContentProps) {
  return (
    <section className="px-6 max-w-4xl mx-auto mb-16">
      <ScrollReveal>
        <SectionEyebrow>Shot priorities</SectionEyebrow>
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--andromeda-text-primary)] mb-2">
          Where to spend the day
        </h2>
        <p className="text-sm text-[var(--andromeda-text-secondary)] mb-8 max-w-2xl">
          Tier 1 must be captured well. Tier 2 is bonus — fill in only if Tier 1 is solid.
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-[var(--andromeda-accent-beige)]" />
          <span className="text-xs uppercase tracking-wider text-[var(--andromeda-accent-beige)] font-semibold">
            Tier 1 · Must capture
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {brief.shotPriorities.tier1.map((item, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-[var(--andromeda-accent-beige)]/30 bg-[var(--andromeda-accent-beige)]/5 p-4"
            >
              <div className="text-sm font-medium text-[var(--andromeda-text-primary)]">{item.label}</div>
              {item.description && (
                <div className="text-xs text-[var(--andromeda-text-secondary)] mt-1">{item.description}</div>
              )}
            </div>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="w-4 h-4 text-[var(--andromeda-text-secondary)]" />
          <span className="text-xs uppercase tracking-wider text-[var(--andromeda-text-secondary)] font-semibold">
            Tier 2 · Bonus
          </span>
        </div>
        <ul className="space-y-1.5 text-sm text-[var(--andromeda-text-secondary)] pl-4">
          {brief.shotPriorities.tier2.map((item, idx) => (
            <li key={idx} className="list-disc">
              {item.label}
              {item.description && <span className="text-[var(--andromeda-text-secondary)]/70"> — {item.description}</span>}
            </li>
          ))}
        </ul>
      </ScrollReveal>
    </section>
  );
}

// ─── Full shot list ─────────────────────────────────────────────────────────

function BriefShotList({ brief }: BriefContentProps) {
  return (
    <section className="px-6 max-w-4xl mx-auto mb-16">
      <ScrollReveal>
        <SectionEyebrow>Full shot list</SectionEyebrow>
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--andromeda-text-primary)] mb-2">
          Reference checklist
        </h2>
        <p className="text-sm text-[var(--andromeda-text-secondary)] mb-8 max-w-2xl">
          Tap an area to expand. Items marked <strong className="text-[var(--andromeda-text-primary)]">must</strong> are non-negotiable.
        </p>
      </ScrollReveal>

      <div className="space-y-8">
        {brief.shotList.map((venue) => (
          <ScrollReveal key={venue.venueName}>
            <div>
              <h3 className="text-lg font-semibold text-[var(--andromeda-text-primary)] mb-3">
                {venue.venueName}
              </h3>
              <div className="space-y-2">
                {venue.areas.map((area) => (
                  <ShotListArea key={area.id} title={area.title} items={area.items} />
                ))}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function ShotListArea({ title, items }: { title: string; items: { label: string; mustHave?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const mustCount = items.filter((i) => i.mustHave).length;
  return (
    <div className="rounded-lg border border-[var(--andromeda-accent-beige)]/15 bg-[var(--andromeda-secondary)]/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-[var(--andromeda-secondary)]/50 transition-colors focus:outline-none focus:bg-[var(--andromeda-secondary)]/50"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--andromeda-text-primary)]">{title}</div>
          <div className="text-xs text-[var(--andromeda-text-secondary)]/70 mt-0.5">
            {items.length} item{items.length === 1 ? "" : "s"}
            {mustCount > 0 && <span> · {mustCount} must</span>}
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[var(--andromeda-text-secondary)] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--andromeda-text-secondary)] shrink-0" />
        )}
      </button>
      <ExpandCollapse isExpanded={open}>
        <ul className="px-4 pb-4 pt-1 space-y-1.5 border-t border-[var(--andromeda-accent-beige)]/10">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-[var(--andromeda-text-secondary)]">
              <span className="text-[var(--andromeda-accent-beige)]/60 mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
              <span>
                {item.label}
                {item.mustHave && (
                  <span className="ml-2 inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[var(--andromeda-accent-beige)]/40 text-[var(--andromeda-accent-beige)]">
                    Must
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </ExpandCollapse>
    </div>
  );
}

// ─── Logistics ──────────────────────────────────────────────────────────────

function BriefLogistics({ brief }: BriefContentProps) {
  return (
    <section className="px-6 max-w-4xl mx-auto mb-16">
      <ScrollReveal>
        <SectionEyebrow>Day-of logistics</SectionEyebrow>
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--andromeda-text-primary)] mb-8">
          Timing, prep, and people
        </h2>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScrollReveal>
          <LogisticsCard icon={<Clock className="w-4 h-4" />} title="Timing">
            <p className="text-sm text-[var(--andromeda-text-secondary)] mb-3">{brief.logistics.recommendedDates}</p>
            <ul className="space-y-2">
              {brief.logistics.timing.map((slot, idx) => (
                <li key={idx} className="text-sm">
                  <span className="text-[var(--andromeda-text-primary)] font-medium">{slot.label}</span>
                  <span className="text-[var(--andromeda-text-secondary)]"> · {slot.range}</span>
                </li>
              ))}
            </ul>
          </LogisticsCard>
        </ScrollReveal>

        <ScrollReveal>
          <LogisticsCard icon={<ClipboardList className="w-4 h-4" />} title="Prep checklist">
            <ul className="space-y-1.5 text-sm text-[var(--andromeda-text-secondary)]">
              {brief.logistics.prepChecklist.map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-[var(--andromeda-accent-beige)]/60 shrink-0">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </LogisticsCard>
        </ScrollReveal>

        <ScrollReveal>
          <LogisticsCard icon={<Users className="w-4 h-4" />} title="Staff guidance">
            <ul className="space-y-1.5 text-sm text-[var(--andromeda-text-secondary)]">
              {brief.logistics.staffGuidance.map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-[var(--andromeda-accent-beige)]/60 shrink-0">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </LogisticsCard>
        </ScrollReveal>
      </div>
    </section>
  );
}

function LogisticsCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--andromeda-accent-beige)]/20 bg-[var(--andromeda-secondary)]/40 p-5 h-full">
      <div className="flex items-center gap-2 mb-3 text-[var(--andromeda-accent-beige)]">
        {icon}
        <span className="text-xs uppercase tracking-wider font-semibold">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Deliverables ───────────────────────────────────────────────────────────

function BriefDeliverables({ brief }: BriefContentProps) {
  return (
    <section className="px-6 max-w-4xl mx-auto mb-16">
      <ScrollReveal>
        <SectionEyebrow>Deliverables</SectionEyebrow>
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--andromeda-text-primary)] mb-8">
          What we&apos;re expecting back
        </h2>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brief.deliverables.categories.map((cat, idx) => (
          <ScrollReveal key={idx}>
            <div className="rounded-xl border border-[var(--andromeda-accent-beige)]/20 bg-[var(--andromeda-secondary)]/40 p-5 h-full">
              <div className="flex items-center gap-2 mb-3 text-[var(--andromeda-accent-beige)]">
                <Package className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">{cat.label}</span>
              </div>
              <ul className="space-y-1.5 text-sm text-[var(--andromeda-text-secondary)]">
                {cat.items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[var(--andromeda-accent-beige)]/60 shrink-0">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function BriefFooter({ brief }: BriefContentProps) {
  return (
    <section className="px-6 max-w-4xl mx-auto pt-8 border-t border-[var(--andromeda-accent-beige)]/15">
      <p className="text-xs text-[var(--andromeda-text-secondary)]/70 text-center">
        Questions? Reach out at{" "}
        <a
          href={`mailto:${brief.contactEmail}`}
          className="text-[var(--andromeda-accent-beige)] hover:underline"
        >
          {brief.contactEmail}
        </a>
        .
      </p>
    </section>
  );
}

// ─── Shared ─────────────────────────────────────────────────────────────────

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs uppercase tracking-wider text-[var(--andromeda-accent-beige)] mb-2 font-semibold">
      {children}
    </div>
  );
}
