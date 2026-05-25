# AI Hiring Signals — Product Requirements Document

**Product:** AI Hiring Signals  
**Made by:** 100xbetter.ai  
**Stack:** FastAPI (backend) · Next.js (frontend) · Supabase (database)  
**Repo:** github.com/al3sha9/AI-company-hiring-insights  

---

## 1. What Is This Product

AI Hiring Signals is an intelligence dashboard that tracks what the leading AI companies are hiring for — and interprets what those hiring patterns signal about their strategic direction.

It is not a job board. Users do not come here to apply for jobs. They come here to **understand where AI is going** by reading the only public signal AI companies cannot fake: who they are actually paying people to be.

---

## 2. The Core Insight

AI companies reveal their strategy through hiring before they announce it publicly. A company hiring 48 science tutors is not building an education product — they are building RLHF training pipelines for scientific reasoning. A company hiring civil engineers is expanding its data center footprint. A company with 60% senior hires in a category is making a committed capability bet, not experimenting.

This product decodes that signal and presents it clearly.

---

## 3. Who It Is For

**Primary user:** Investors, analysts, journalists, and AI practitioners who want to understand the strategic direction of the leading AI companies ahead of public announcements.

**Secondary users:**
- Job seekers who want to understand where each company is growing
- Founders who want to track where incumbents are placing bets (to compete or avoid)
- Researchers studying the AI industry

**User intent:** "I want to know what OpenAI, Anthropic, xAI, and others are actually building right now — not what they say in press releases."

---

## 4. What Data We Collect

**Sources (scraped directly from official career pages):**

| Company | Scraper method |
|---|---|
| OpenAI | Ashby API (`api.ashbyhq.com/posting-api/job-board/openai`) |
| Anthropic | Ashby API |
| xAI | Greenhouse API |
| CoreWeave | Greenhouse API |
| Perplexity | Ashby API |
| Mistral | Ashby API |

**Per role, we store:**

| Field | Description |
|---|---|
| `title` | Exact job title as listed |
| `category` | Inferred category (Engineering, Sales, Policy, etc.) |
| `location` | City/country string from listing |
| `country` | Normalised country name |
| `seniority` | Inferred level (Junior / Mid / Senior / Staff / Lead / Principal / Director) |
| `work_mode` | Remote / Hybrid / On-site |
| `source_url` | Direct link to the listing |
| `company_slug` | Which company this belongs to |
| `first_seen_at` | When we first scraped this role |
| `last_seen_at` | Last time the role was still live |

**Scrape cadence:** Manual trigger via `POST /scrape/run` (protected by `SCRAPE_SECRET`). Designed to run on a cron job — daily or weekly.

---

## 5. What the Dashboard Shows

### 5.1 Metric Cards (top of dashboard, 5 cards)

| Card | Value shown | Change shown |
|---|---|---|
| Total open roles | Sum across all companies | Delta vs prior scrape period |
| Week-over-week change | % change in total | Context label |
| Fastest growing company | Company name | % change this period |
| Momentum category | Top category by role count | Total roles in that category |
| Top hiring location | Country with most roles | Total roles in that country |

### 5.2 Company Table — "Who is hiring fastest?"

Ranked by WoW change. Columns:

- Company (logo + name, links to company page)
- Open roles (links to filtered roles view)
- WoW change %
- Top growing category
- Top hiring location
- **Unusual signal** — detected non-standard hiring pattern with count and short interpretation

### 5.3 Insight Cards (right sidebar, 3 cards)

Auto-generated editorial text derived from live data:

- **"What jumped this week"** — top category with role count across all companies
- **"Strongest signal"** — seniority-weighted interpretation of the top category (e.g. "68% senior-level — capability building, not scaling")
- **"Where the map is shifting"** — top hiring location with leading company

### 5.4 Heatmap — "Where each company is placing its bets"

Category × Company grid. Rows = role categories. Columns = companies. Cell = role count, coloured by intensity (teal gradient). Immediately shows concentration patterns — which categories are shared bets vs. unique to one company.

### 5.5 Category Bars — "Role categories growing fastest"

Horizontal bars per category. Each bar is split by seniority: dark teal = Senior, mid teal = Mid, light = Junior. Right-aligned count per category. Links to filtered roles view.

### 5.6 Location List — "Top hiring locations"

Ranked list of countries by role count. Each row shows: rank, country name, leading company in that country, and a proportional bar.

---

## 6. Pages

### Page 1: Dashboard (`/`)

The main intelligence view. Everything in section 5 above. Filterable by company and country via URL params (`?company=OpenAI&country=US`).

**Purpose:** Give a market-wide view of AI hiring momentum in a single scroll.

### Page 2: Company Page (`/company/[slug]`)

Deep-dive on a single company.

**Header:**
- Company logo (via logo.dev) + name + signal badge (Build / Scale / Growth)
- Auto-generated narrative: "Anthropic is concentrating 68% of open roles in Engineering, with 84% of positions in the US. 61% of roles are senior-level — a signal of capability building."
- Open roles sparkline trend chart

**Stat cards (4):**
- Open roles
- WoW change
- Roles on record
- Work mode breakdown (Remote / Hybrid / On-site counts)

**Seniority split bar:**
Full-width bar split into Senior / Mid / Junior with percentages. Immediately readable as "Build" or "Scale" signal.

**Three breakdown panels:**
- Location breakdown (bars with % labels)
- Category breakdown (bars with % labels)
- Latest 5 roles (from real API data, sorted by last_seen_at)

**Full roles table:**
All scraped roles for this company. Columns: Role (links to source), Category, Location, Seniority, Work mode.

**Purpose:** Answer "what is this company actually building right now?"

### Page 3: Roles View (`/roles`)

Filterable list of all roles across all companies.

**Filters:** Company, Category, Country, Seniority, Work mode  
**Columns:** Title, Company, Category, Location, Seniority, Work mode, Link

**Purpose:** Power-user browse and search across all scraped roles.

---

## 7. Unusual Signal Detection

The system scans role titles for keywords that are atypical for a software company but carry strong strategic meaning. If 2 or more matching roles are found at a company, a signal is surfaced.

**Current detected patterns:**

| Pattern | Keywords | What it signals |
|---|---|---|
| Science trainers | tutor, biologist, chemist, physicist | RLHF pipeline for scientific reasoning |
| Data annotators | annotator, labeler, rater | Training data pipeline scaling |
| Red teamers | red team, adversarial | Safety and adversarial evaluation |
| Trust & safety | ethicist, trust & safety, content policy | AI governance and policy pressure |
| Policy & gov't | policy, government affairs, regulatory | Regulatory engagement and government sales |
| Legal roles | lawyer, attorney, compliance | Enterprise or regulated market push |
| Infra ops | data center, mechanical engineer, electrical engineer | Physical compute infrastructure at scale |
| Creative domain | filmmaker, animator, concept artist | Multimodal model training (video/image gen) |
| Medical roles | doctor, physician, clinical | Healthcare AI capability pipeline |
| Economics research | economist, market design | Pricing, welfare, or market modeling |
| Alignment research | alignment, interpretability, mechanistic | Fundamental AI safety investment |
| Robotics | robotics, mechatronics, embodied | Physical AI and embodied intelligence |

---

## 8. Inputs

| Input | Who provides it | How |
|---|---|---|
| Scrape trigger | Admin / cron | `POST /scrape/run` with `Authorization: Bearer {SCRAPE_SECRET}` |
| Company filter | Dashboard user | URL param `?company=OpenAI` |
| Country filter | Dashboard user | URL param `?country=US` |
| Date range filter | Dashboard user (future) | URL param `?range=30d` |

---

## 9. Ideal UI — Full Vision

### Design Principles

- **Minimal, editorial, data-first.** No decorative elements. Every pixel carries information.
- **Opinionated, not neutral.** The app interprets data, it does not just display it. Users should leave with a point of view, not just numbers.
- **Scannable at a glance.** A user should understand the key signals in under 10 seconds without reading a word of body text.
- **No placeholders.** Every section is either populated with real data or clearly indicates why it is not yet available.

### Typography & Colour

- Font: SF Pro  apple font
- Type scale: 12px · 13px · 14px · 16px · 18px · 24px
- Colours: `#292929` (ink) · `#5D5D5D` (muted) · `#7F7F7F` (subtle) · `#F5F5F5` (selected) · `#F2F2F2` (border)
- Accent: teal (`#0D9488` family) for positive signals
- Signal: amber for unusual patterns, red for declines

### Ideal Dashboard Layout

```
┌──────────────────────────────────────────────────────────┐
│ AI Hiring Signals  by 100xbetter.ai          [Filters]   │
│ Track where AI companies are hiring...                    │
│ Data last scraped May 23, 2026                           │
├──────────────────────────────────────────────────────────┤
│ [Total roles] [WoW %] [Fastest co.] [Top cat.] [Top loc] │  ← 5 metric cards
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Who is hiring fastest?          │  What jumped this     │
│  ┌───────────────────────────┐   │  week                 │  ← Company table + 
│  │ 1. OpenAI   699  +0% ...  │   │                       │    3 insight cards
│  │ 2. Anthropic 390 -7% ...  │   │  Strongest signal     │
│  └───────────────────────────┘   │                       │
│                                  │  Where map shifted    │
├──────────────────────────────────────────────────────────┤
│  Where each company is placing its bets (heatmap)        │  ← Category × Company
│  Eng  │ Sales │ Policy │ Infra │ Safety │ ...           │    colour grid
├─────────────────────────┬────────────────────────────────┤
│  Role categories        │  Top hiring locations          │  ← Split bars + location list
│  (seniority split bars) │  (ranked by role count)        │
└─────────────────────────┴────────────────────────────────┘
```

### Ideal Company Page Layout

```
┌──────────────────────────────────────────────────────────┐
│ ← Back    [Logo] Anthropic  [Build]                      │
│ "Concentrating 68% in Engineering, 84% US-based..."      │
│                                     [Sparkline trend]    │
├──────────────────────────────────────────────────────────┤
│ [390 roles] [−7.4% WoW] [390 total] [Remote: 210]       │  ← 4 stat cards
├──────────────────────────────────────────────────────────┤
│ Seniority mix: ████████████████░░░░░░░░░░░░░            │  ← Split bar
│                Senior 61%  Mid 28%  Junior 11%           │
├──────────────────────────────────────────────────────────┤
│ [Locations]  [Categories]  [Latest 5 roles]              │  ← 3 panels
├──────────────────────────────────────────────────────────┤
│ All Anthropic roles  (390)             [Open filtered]   │
│ Role | Category | Location | Seniority | Work mode       │  ← Full table
└──────────────────────────────────────────────────────────┘
```

---

## 10. Ideal Feature Roadmap (not yet built)

### Near-term (data already available)

- **Trend charts per category** — show how Engineering / Safety / Policy role counts have changed across every scrape run over time. This is the most important missing visual.
- **Strategic signals card on company page** — auto-generated interpretation of unusual roles above the full table (e.g. "xAI has 48 science trainer roles — RLHF pipeline signal").
- **Cross-company category velocity** — "+34% across 4 companies" for Infrastructure this week. The editorial voice the dashboard needs.

### Medium-term (requires more data or new endpoints)

- **Automated weekly digest** — email or Substack-style newsletter generated from the weekly scrape diff.
- **Role appearance / disappearance tracking** — when a role that was listed is no longer found, flag it. Roles that vanish might signal the capability was built or the bet was cancelled.
- **Comparative company profiles** — side-by-side seniority, category, and location breakdowns for two companies.
- **Search across all roles** — full-text search on role titles across all companies.

### Long-term (significant build)

- **LLM-generated strategic interpretation** — send top 10 unusual titles per company to an LLM and generate a short paragraph of editorial interpretation. Much richer than rule-based signals.
- **Expand to 20+ companies** — add Cohere, Inflection, DeepMind, Meta AI, Microsoft AI, Apple ML, Amazon Bedrock, and others.
- **Historical trend database** — run the scraper weekly for 6+ months and build time-series charts showing how each category has moved.
- **API access** — allow analysts to query the raw data programmatically.
- **Alert system** — "notify me when Anthropic posts a new Government Affairs role."

---

## 11. Technical Architecture

```
                  ┌─────────────────┐
                  │  Cron / Admin   │
                  └────────┬────────┘
                           │ POST /scrape/run
                  ┌────────▼────────┐
                  │   FastAPI       │
                  │   (Python)      │◄──── Scrapers (per company)
                  │                 │      Ashby API / Greenhouse API
                  └────────┬────────┘
                           │ Upsert roles, snapshots
                  ┌────────▼────────┐
                  │   Supabase      │
                  │   (Postgres)    │
                  └────────┬────────┘
                           │ REST API (PostgREST)
                  ┌────────▼────────┐
                  │   Next.js       │
                  │   (Frontend)    │
                  │   Server comps  │
                  └─────────────────┘
```

**Key tables:** `companies` · `roles` · `role_snapshots`  
**Key endpoints:** `/companies` · `/companies/{slug}` · `/categories` · `/locations` · `/category-matrix` · `/categories/seniority` · `/unusual-signals` · `/scrape/run`

---

## 12. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_KEY` | Yes | Supabase service role key |
| `SCRAPE_SECRET` | Yes | Bearer token to authorise scrape triggers |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL for frontend fetches |
| `NEXT_PUBLIC_LOGO_DEV_TOKEN` | No | logo.dev API token for company logos |
