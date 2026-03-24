# Andromeda — attakorah.com

Personal portfolio and professional web presence for [Joseph Afriyie Attakorah](https://attakorah.com) — Software Engineer focused on systems, monitoring, and operations.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **3D**: React Three Fiber / Three.js
- **Content**: MDX (local files) + Google Sheets (remote posts)
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel

## Project Structure

```
app/
  page.tsx                    # Home page
  perspective/                # Perspectives (posts) — list + slug pages + RSS
  projects/[slug]/            # Project case study pages
  proposal/[id]/              # Protected client proposals (access-gated)
  api/proposal/verify/        # API route for proposal access verification

components/
  sections/                   # Page sections (hero, projects, perspective, connect, etc.)
  perspective/                # Post-related components (card, content, MDX renderer, etc.)
  proposals/                  # Proposal components (hero, CTA, pricing, timeline, etc.)
  ui/                         # Shared UI primitives
  animations/                 # Scroll reveal, motion wrappers

content/
  perspective/                # Local MDX posts, organised by category

lib/
  content.ts                  # MDX post loading + Google Sheets merging
  google-sheets.ts            # Google Sheets client (posts + proposals)
  dates.ts                    # Shared date formatting utility
  hooks/                      # useAnalytics, useKeyboardNav, etc.

constants/
  profile.ts                  # Site-wide identity, SEO, and social links
  projects.ts                 # Project card data
  projects-detail.ts          # Full project case study content
```

## Key Features

- **Projects** — Expandable inline cards with location, status badge, and full case study pages
- **Perspectives** — MDX + Google Sheets hybrid content system at `/perspective`
- **Proposals** — Access-code protected client proposals with hero, pricing, timeline, and CTA sections
- **RSS feed** — `/perspective/rss.xml`
- **Sitemap** — Auto-generated at `/sitemap.xml`
- **Redirects** — `/writing/*` → `/perspective/*` (308 permanent)

## Environment Variables

```env
NEXT_PUBLIC_SITE_URL=https://attakorah.com
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_PROPOSALS_SHEET_ID=
```

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
