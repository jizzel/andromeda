# Andromeda — attakorah.com

Personal portfolio and professional web presence for [Joseph Afriyie Attakorah](https://attakorah.com) — Software Engineer focused on systems, monitoring, and operations.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **3D**: React Three Fiber / Three.js
- **Content**: MDX (local files) + Google Sheets (remote posts and client work)
- **Email**: Resend + React Email templates
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel

## Project Structure

```
app/
  page.tsx                      # Home page
  perspective/                  # Posts — list + slug pages + RSS
  projects/[slug]/              # Project case study pages
  proposal/[id]/                # Protected client proposals (access-gated)
    assets/                     # Asset checklist (post-acceptance content gathering)
    tracker/                    # Live project tracker — phases, milestones, dates
  brief/[id]/                   # Creative brief for external collaborators (photographers, etc.)
  api/
    proposal/verify/            # Proposal access verification
    proposal/acceptance/        # Accept / counter submissions
    proposal/assets/            # Asset checklist read + toggle
    proposal/tracker/           # Tracker state read
    proposal/tracker/notify/    # Apps Script webhook → client emails
    proposal/tracker/approve/   # Client-driven milestone approval
    brief/verify/               # Brief access verification

components/
  sections/                     # Page sections (hero, projects, perspective, connect, etc.)
  perspective/                  # Post-related components (card, content, MDX renderer)
  proposals/                    # Proposal viewer + acceptance + assets + tracker UI
  brief/                        # Creative brief viewer
  ui/                           # Shared UI primitives
  animations/                   # ScrollReveal, ExpandCollapse, motion wrappers

content/
  perspective/                  # Local MDX posts, organised by category

emails/
  MilestoneUpdate.tsx           # Client-facing tracker notification
  ClientApprovalNotice.tsx      # Joseph-facing approval alert

lib/
  content.ts                    # MDX post loading + Google Sheets merging
  google-sheets.ts              # Sheets client (proposals, briefs, posts, tracker, assets)
  tracker.ts                    # Tracker seeding + state helpers
  email.ts                      # Resend integration
  dates.ts                      # Shared date formatting
  hooks/                        # useAnalytics, useKeyboardNav, etc.

constants/
  profile.ts                    # Site-wide identity, SEO, social links (env-driven)
  projects.ts                   # Project card data
  projects-detail.ts            # Full project case study content
  tracker-templates.ts          # Reusable tracker phase templates

proxy.ts                        # CSP + security headers (replaces middleware.ts in Next 16)
```

## Key Features

- **Projects** — Expandable inline cards with status badges, plus full case study pages.
- **Perspectives** — MDX + Google Sheets hybrid blog at `/perspective`.
- **Proposals** — Access-code protected client proposals with overview, packages, payment plans, and timeline.
- **Proposal acceptance** — Clients accept as-presented or with counter-terms; recorded in the `ProposalAcceptance` sheet tab.
- **Asset checklist** — Post-acceptance content gathering at `/proposal/[id]/assets`, with required / recommended / optional priorities and live progress sync.
- **Project tracker** — Live status timeline at `/proposal/[id]/tracker` with phases, milestones, dates, and notes. Composable templates with per-proposal additions.
- **Client milestone approvals** — Clients can self-approve specific milestones (e.g. "Final approval") from the tracker; sends Joseph an email confirmation.
- **Email notifications** — Resend-powered, fired by Apps Script `onEdit` on the tracker sheet. Auto-stamps timestamps via the same script.
- **Creative brief** — Separate gated route at `/brief/[id]` for sharing mood boards / shot lists with external collaborators on a distinct access code.
- **Security headers** — Strict CSP with per-request nonce via `proxy.ts`; `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` in `next.config.ts`.
- **RSS feed** — `/perspective/rss.xml`
- **Sitemap** — Auto-generated at `/sitemap.xml`
- **Redirects** — `/writing/*` → `/perspective/*` (308 permanent)

## Environment Variables

```env
NEXT_PUBLIC_SITE_URL=https://attakorah.com

# Profile — exposed to client bundle, required.
# `profile.name` is derived as `first + middle + surname` (middle optional).
NEXT_PUBLIC_PROFILE_FIRST_NAME=
NEXT_PUBLIC_PROFILE_MIDDLE_NAME=     # Optional — only field that may be empty
NEXT_PUBLIC_PROFILE_SURNAME=
NEXT_PUBLIC_PROFILE_EMAIL=
NEXT_PUBLIC_PROFILE_PHONE=
NEXT_PUBLIC_PROFILE_LOCATION=
NEXT_PUBLIC_PROFILE_IMAGE=           # Path under /public e.g. /images/profile.jpg
NEXT_PUBLIC_SOCIAL_GITHUB=
NEXT_PUBLIC_SOCIAL_LINKEDIN=
NEXT_PUBLIC_SOCIAL_CALENDLY=

# Google Sheets (single spreadsheet hosts Proposals, BlogPosts, ProposalAcceptance,
# ProposalAssets, ProjectTracker, and CreativeBrief tabs).
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=                  # Use \n literal for newlines; code converts to real \n
GOOGLE_PROPOSALS_SHEET_ID=

# Tracker email notifications (only required for tracker-enabled proposals).
RESEND_API_KEY=
NOTIFICATION_FROM_EMAIL=             # e.g. notifications@attakorah.com (verified in Resend)
TRACKER_WEBHOOK_SECRET=              # Shared secret with the Apps Script onEdit trigger
```

The profile vars are validated at module load (`constants/profile.ts`) — the build fails loudly rather than rendering with blanks. Without the Sheets/email vars, proposal verification and sheet-based posts silently return empty; the site still boots.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm run start
```

## Further documentation

`CLAUDE.md` carries the detailed architecture notes — content system internals, tracker data model, Apps Script wiring, gate component variants, and conventions. Start there when extending any of the proposal-side features.
