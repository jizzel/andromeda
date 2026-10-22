import { Check } from "lucide-react";
import {
  BUILD_HEADING,
  CAPABILITIES_INTRO,
  ENGAGEMENT_MODES,
  STATEMENT_TITLE,
  TECH_EXPERTISE,
  groupsInStage,
  isDelivered,
  type CatalogueGroup,
} from "@/constants/capability-catalogue";
import { profile, socialLinks } from "@/constants/profile";

const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/**
 * The one-page "Software Engineering & Solutions Capabilities Statement"
 * (rendered to PDF from /capabilities/print). Built from the same catalogue
 * as /capabilities, condensed to fit a single A4 page: keep it that way when
 * adding content (the PDF route is checked to produce exactly one page).
 * Blocks are divs, not sections: the proposal print CSS pads `main section`.
 */
export function CapabilitiesStatement() {
  return (
    <article className="mx-auto max-w-[186mm] text-[11px] leading-snug text-[var(--andromeda-text-secondary)]">
      <header className="mb-3 border-b border-black/15 pb-3">
        <h1 className="text-[19px] font-bold text-[var(--andromeda-text-primary)]">{STATEMENT_TITLE}</h1>
        <p className="mt-0.5 text-[12px] font-medium text-[var(--andromeda-text-primary)]">
          {profile.name} · {profile.title}
        </p>
        <p className="mt-1.5">{CAPABILITIES_INTRO}</p>
        <p className="mt-1.5 flex items-center gap-1 text-[9.5px]">
          <Check className="h-3 w-3 text-emerald-700" aria-hidden /> marks areas backed by delivered work; case studies at {host(profile.siteUrl)}/capabilities.
        </p>
      </header>

      {groupsInStage("advise").map((group) => (
        <CompactGroup key={group.id} group={group} />
      ))}

      <div className="mb-1">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-[var(--andromeda-text-primary)]">{BUILD_HEADING}</h2>
      </div>
      {groupsInStage("build").map((group) => (
        <div key={group.id} className="mb-2">
          <h3 className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)]">{group.title}</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {group.items.map((item) => (
              <div key={item.id}>
                <p className="flex items-center gap-1 font-semibold text-[var(--andromeda-text-primary)]">
                  {item.title}
                  {isDelivered(item) && <Check className="h-3 w-3 shrink-0 text-emerald-700" aria-label="Delivered" />}
                </p>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {groupsInStage("adopt").map((group) => (
        <CompactGroup key={group.id} group={group} />
      ))}

      <div className="mb-2.5">
        <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--andromeda-text-primary)]">Technical expertise</h2>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
          {TECH_EXPERTISE.map((row) => (
            <div key={row.area} className="contents">
              <dt className="font-semibold text-[var(--andromeda-text-primary)]">{row.area}</dt>
              <dd>{row.items.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mb-3">
        <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--andromeda-text-primary)]">How we can work together</h2>
        <p>{ENGAGEMENT_MODES.map((mode) => mode.title).join(" · ")}</p>
      </div>

      <footer className="border-t border-black/15 pt-2 text-[10.5px]">
        <p className="text-[var(--andromeda-text-primary)]">
          {profile.email} · {host(profile.siteUrl)} · {host(socialLinks.linkedin)}
        </p>
        <p className="mt-0.5">Full profile with case studies: {host(profile.siteUrl)}/capabilities</p>
      </footer>
    </article>
  );
}

/** Advise & design / Put it to work: three items side by side, title and one line each. */
function CompactGroup({ group }: { group: CatalogueGroup }) {
  return (
    <div className="mb-2.5">
      <h2 className="mb-1 text-[12px] font-bold uppercase tracking-wider text-[var(--andromeda-text-primary)]">{group.title}</h2>
      <div className="grid grid-cols-3 gap-x-5">
        {group.items.map((item) => (
          <div key={item.id}>
            <p className="flex items-center gap-1 font-semibold text-[var(--andromeda-text-primary)]">
              {item.title}
              {isDelivered(item) && <Check className="h-3 w-3 shrink-0 text-emerald-700" aria-label="Delivered" />}
            </p>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
