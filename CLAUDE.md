# CLAUDE.md

This file provides guidance for AI assistants working with the `claude-seo` repository.

## Project Overview

**Repository:** clinkarad-bit/claude-seo
**Purpose:** A full-stack SEO & Content Marketing Automation Tool that automates the complete workflow from topic research to performance monitoring.

## Architecture

**Tech Stack:**
- **Frontend/Backend:** Next.js 14 (App Router), TypeScript
- **Database:** SQLite via Prisma ORM (swappable to PostgreSQL)
- **AI Integration:** Anthropic Claude API + OpenAI API (with mock fallback for development)
- **SEO Data:** DataForSEO API (with mock fallback for development)
- **PDF Processing:** `pdf-parse` library
- **Styling:** Tailwind CSS with custom design tokens (pink `#FF2D55` primary color)
- **UI Components:** Radix UI primitives (Dialog, Tabs, Select, etc.)
- **Testing:** Jest + React Testing Library + Playwright E2E

## Repository Structure

```
claude-seo/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── layout.tsx              # Root layout with Sidebar
│   │   ├── page.tsx                # Dashboard / home
│   │   ├── globals.css             # Global CSS + Tailwind + CSS variables
│   │   ├── kunden/                 # Customer management
│   │   │   ├── page.tsx            # Customer list
│   │   │   └── [id]/page.tsx       # Customer detail + topic clusters
│   │   ├── themenrecherche/        # Topic research
│   │   │   ├── page.tsx            # Cluster list
│   │   │   └── [id]/page.tsx       # Cluster detail with 4-tab topic view
│   │   ├── outlines/               # SEO outlines
│   │   │   ├── page.tsx            # Outline list
│   │   │   └── [id]/page.tsx       # Outline detail with sections
│   │   ├── content/                # Content pieces
│   │   │   ├── page.tsx            # Content list with performance scores
│   │   │   └── [id]/page.tsx       # Content detail with editor + rankings
│   │   ├── performance/            # Performance monitoring
│   │   │   └── page.tsx            # Dashboard with keyword rankings
│   │   └── api/                    # REST API routes
│   │       ├── customers/          # CRUD + PDF upload
│   │       ├── topic-clusters/     # CRUD + AI topic generation
│   │       ├── topics/[id]/keywords/  # Keyword research per topic
│   │       ├── outlines/           # CRUD + AI outline generation + feedback
│   │       ├── content/            # CRUD + AI content generation + feedback
│   │       └── performance/        # GSC mock + score calculation
│   ├── components/
│   │   ├── ui/                     # Reusable UI primitives (Button, Card, etc.)
│   │   ├── layout/                 # Sidebar, PageHeader
│   │   ├── shared/                 # StatusBadge, LoadingSpinner, FeedbackDialog
│   │   ├── customers/              # CustomerCreateDialog
│   │   ├── topics/                 # TopicClusterCreateDialog, TopicClusterView
│   │   ├── outlines/               # OutlineCreateFromTopicWidget, OutlineDetailView
│   │   ├── content/                # ContentDetailView
│   │   └── performance/            # PerformanceMeasureButton
│   ├── lib/
│   │   ├── db.ts                   # Prisma client singleton
│   │   ├── ai.ts                   # AI integration (Claude/OpenAI + mocks)
│   │   ├── pdf.ts                  # PDF text extraction
│   │   ├── seo.ts                  # DataForSEO, performance score, TF*IDF, slugs
│   │   └── utils.ts                # cn(), formatDate, parseJSON, status helpers
│   └── types/
│       └── index.ts                # TypeScript interfaces for all entities
├── prisma/
│   ├── schema.prisma               # Full data model (SQLite)
│   └── seed.ts                     # Demo data seeder
├── tests/
│   ├── unit/                       # seo.test.ts, utils.test.ts
│   ├── integration/                # api.test.ts (mocked Prisma + AI)
│   └── e2e/                        # navigation.spec.ts (Playwright)
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── CLAUDE.md
```

## Key Commands

```bash
# Install dependencies
npm install

# Set up database (generate Prisma client + push schema)
npm run db:generate
npm run db:push

# Seed with demo data
npm run db:seed

# Run development server
npm run dev

# Run tests
npm test                 # Unit + integration tests
npm run test:e2e         # Playwright E2E tests

# Lint and typecheck
npm run lint
npm run typecheck

# Build for production
npm run build
npm start

# Docker
docker-compose up -d
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite: `file:./dev.db` or PostgreSQL URL |
| `ANTHROPIC_API_KEY` | No | Claude API key – mocks used if absent |
| `OPENAI_API_KEY` | No | OpenAI API key – mocks used if absent |
| `DATAFORSEO_LOGIN` | No | DataForSEO login – mocks used if absent |
| `DATAFORSEO_PASSWORD` | No | DataForSEO password |
| `NEXT_PUBLIC_APP_URL` | No | App URL, default `http://localhost:3000` |

**Important:** The tool fully functions without any API keys using realistic mock data — ideal for development and testing.

## Data Model

```
Customer
  └── TopicCluster (many)
        └── Topic (many, 4 categories: conversion/produktnah/enger/ferner)
              ├── Keyword (many)
              └── Outline (one)
                    └── ContentPiece (one)
                          ├── PerformanceTracking (many, per keyword)
                          └── PerformanceHistory (many, weekly scores)
```

## Module Workflows

### 1. Customer Management (`/kunden`)
- Create customers with company info, domain, PDF guidelines + example texts
- PDFs are stored in `/public/uploads/` and text is extracted via `pdf-parse`
- Customer profile is used to personalize all AI prompts

### 2. Topic Research (`/themenrecherche`)
- Select customer + enter topic cluster name + seed keywords
- AI (Claude) generates 60 topic suggestions across 4 categories
- Results displayed in 4-tab view; keywords fetched per topic via DataForSEO
- Topics with existing outlines are visually marked

### 3. Outline Creation (`/outlines`)
- Select a topic (without existing outline)
- Optionally upload TF*IDF CSV (`term,score` format)
- AI generates structured outline: H2 sections, bullets, keywords, internal/external links
- Feedback loop: submit feedback → AI revises → history tracked
- From the outline, trigger one-click content generation

### 4. Content Creation (`/content`)
- Generated section by section from the outline (two-pass: content → style)
- Final piece includes title, introduction, meta description, URL slug
- Status workflow: `draft` → `approved` → `published` → `refresh`
- Feedback loop for iterative improvement
- Markdown rendered with keyword highlighting

### 5. Performance Monitoring (`/performance`)
- Shows all `published` content pieces
- "Measure" triggers GSC mock (or real API) per keyword
- Performance score formula: `(ranked/total) * 100 * (1 - avgPosition/100)`
- Color coding: green ≥60, yellow ≥30, red <30
- History chart for trend tracking

## AI Integration Pattern

```typescript
// In src/lib/ai.ts — always falls back to mocks when API keys not set
async function callAI(prompt: string, model: 'claude' | 'openai' = 'claude'): Promise<AIResponse>
```

All prompts are defined as typed functions with explicit parameters. Mock responses mimic real AI output structure (XML for topics, JSON for outlines/meta).

## Code Conventions

- **TypeScript strict mode** throughout — no `any`
- **Server Components** for data fetching pages; **Client Components** for interactive UI
- **Prisma** accessed only in API routes and server components via `@/lib/db`
- **JSON fields** stored as strings in SQLite, deserialized with `parseJSON()` utility
- **`cn()`** utility for conditional Tailwind classes (clsx + tailwind-merge)
- **API routes** follow REST conventions: GET list, POST create, GET/PATCH/DELETE by ID
- **Feedback history** stored as JSON arrays on entities and passed to AI for context

## Design System

- **Primary color:** `#FF2D55` (pink/rosa) mapped to `--primary` CSS variable
- **Status badges:** custom inline spans with color classes from `STATUS_COLORS` map
- **Score badges:** green/yellow/red from `getScoreBadgeClass()` in `src/lib/seo.ts`
- **Card layout:** consistent `Card > CardHeader + CardContent` structure
- **Forms:** always in Dialog modals with loading states and toast notifications

## Testing Approach

- **Unit tests** (`tests/unit/`): pure utility functions — `calculatePerformanceScore`, `parseTFIDFCsv`, `slugify`, etc.
- **Integration tests** (`tests/integration/`): API logic with mocked Prisma + AI
- **E2E tests** (`tests/e2e/`): Playwright navigates the full app (requires running dev server)

## Deployment

Docker Compose (`docker-compose.yml`) runs the production build with:
- SQLite stored in a named volume (`sqlite_data`)
- Uploads in a named volume (`uploads_data`)
- Automatic Prisma migrations on startup
- Health check on port 3000

To switch to PostgreSQL: update `DATABASE_URL` and change `provider = "postgresql"` in `prisma/schema.prisma`.

## Guidelines for AI Assistants

1. **Read before editing** — Always read a file before proposing changes.
2. **Minimal changes** — Only modify what is directly requested.
3. **JSON fields** — SQLite stores arrays/objects as JSON strings; always use `parseJSON()` to deserialize.
4. **Server vs Client** — Don't add `"use client"` to files that fetch data; keep data fetching in server components.
5. **Mock-first** — All external API calls (AI, DataForSEO, GSC) must have mock fallbacks when keys are absent.
6. **Keep this file current** — Update CLAUDE.md when significant structure or conventions change.
7. **Security first** — Never commit `.env` files; validate all API input with Zod.
8. **Test your changes** — Run `npm test` before considering a task complete.
