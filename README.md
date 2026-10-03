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
- **Proposal acceptance** — Clients accept as presented or request changes; recorded in the `ProposalAcceptance` sheet tab. A change request leads to a revised proposal the client then accepts.
- **Proposal versions** — Every response is pinned to a SHA-256 of the proposal terms, with the exact terms kept in `ProposalSnapshots`. A page left open across an edit can't submit stale terms.
- **PDF export** — "Download PDF" renders the live proposal components with headless Chromium (`@sparticuz/chromium` on Vercel); "Print / Save as PDF" is the browser fallback.
- **Admin dashboard** — `/admin`, signed in with a one-time code emailed to the site owner. Overview of every proposal's lifecycle state, response, version drift, asset and tracker progress, plus an editor: validated JSON (zod schemas mirroring the types), live preview, conflict detection against direct sheet edits, duplication, structured forms for packages / payment plans / timeline, and **Publish revision** (records the revision, optionally extends the offer, emails the client a "revised proposal ready" link with a note; the client page shows a "Revised on …" notice), and **agreements**: prepare the General Service Agreement (versioned terms + per-engagement special terms + the accepted proposal) and sign it as the Service Provider; client signing follows after legal review.
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
CRON_SECRET=                         # Bearer secret for the Friday weekly-update Vercel Cron

# Proposal PDF export.
PDF_RENDER_SECRET=                   # HMAC key for short-lived print-route tokens
CHROME_EXECUTABLE_PATH=              # Local dev only: path to an installed Chrome

# Admin dashboard (/admin).
CLIENT_SESSION_SECRET=               # HMAC key for client hub sessions (access code entered once, 12-hour cookie)
ADMIN_SESSION_SECRET=                # HMAC key for admin session + sign-in-code cookies; rotate to sign out everyone
AGREEMENT_SIGNING_SECRET=            # HMAC key for client agreement-signing cookies (emailed one-time code); missing → client signing fails closed
AGREEMENT_CLIENT_SIGNING_ALLOW_DRAFT= # Testing only: "1" allows client signing on a draft template — honoured only on Vercel preview/development or local `next dev`
SHEETS_TIMING_LOG=                   # Optional: "1" logs every Sheets API call with its duration
```

### Spreadsheet tabs

All tabs live in the `GOOGLE_PROPOSALS_SHEET_ID` spreadsheet; the service account needs edit access. Row 1 holds the headers.

| Tab | Headers | Created |
|---|---|---|
| `Proposals` | `id \| accessCode \| expiryDate \| isActive \| data` | manually |
| `BlogPosts` | see `lib/google-sheets.ts` (`BLOG_COLUMNS`) | manually |
| `ProposalAcceptance` | `proposalId \| status \| counterNote \| acceptedAt \| packageId \| paymentPlanId \| proposalVersion` | manually |
| `ProposalAssets` | `proposalId \| itemId \| checked \| checkedAt` | manually |
| `ProjectTracker` | `proposalId \| phaseId \| milestoneId \| status \| startedAt \| completedAt \| note \| updatedAt \| notifiedAt` | manually |
| `WeeklyUpdatesSent` / `WeeklyNotes` | `proposalId \| weekEndingDate \| sentAt` / `… \| note` | manually |
| `CreativeBrief` | `id \| accessCode \| expiryDate \| isActive \| data` | manually |
| `ProposalSnapshots` | `proposalId \| proposalVersion \| capturedAt \| reason \| data` (data continues across columns F–Z for large proposals) | automatically on first use |
| `AdminSignIns` | `nonce \| at \| event \| ip \| userAgent` (append-only sign-in log) | automatically on first use |
| `SheetLocks` | `key \| token \| at \| event` (append-only lock log for admin saves) | automatically on first use |
| `Agreements` | `proposalId \| status \| templateId \| templateVersion \| templateHash \| proposalVersion \| provider \| specialTerms \| offerValidUntil \| agreementHash \| providerSignature \| updatedAt \| selection \| clientName \| acceptedAt \| sentAt \| clientSignature` (one row per proposal; status `draft` → `provider_signed` → `sent` → `executed`) | automatically on first use; missing header cells for new columns are added on the next write |
| `AgreementSnapshots` | `proposalId \| agreementHash \| capturedAt \| reason \| data` (append-only; one row per signing — hash + signedAt in C, reason `provider_signed` or `client_signed` — with the full signed agreement, terms text and accepted proposal, chunked across E–Z) | automatically on first use |
| `AgreementSignIns` | `nonce \| at \| event \| ip \| userAgent \| proposalId` (append-only log of client signing codes: issued / failed / matched) | automatically on first use |
| `EngagementEvents` | `proposalId \| at \| event \| proposalVersion \| detail \| ip \| userAgent` (append-only engagement log: published revisions and their client emails) | automatically on first use |

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

`CLAUDE.md` (kept locally, not in the repo) carries the detailed architecture notes — content system internals, tracker data model, Apps Script wiring, gate component variants, and conventions. Start there when extending any of the proposal-side features.
