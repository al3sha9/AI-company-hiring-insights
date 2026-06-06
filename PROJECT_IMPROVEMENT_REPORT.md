# AI Hiring Signals Improvement Report

## Executive Summary

The project already has a strong thesis: AI companies reveal strategy through hiring before they say it publicly. That is valuable for CEOs, investors, analysts, and operators.

The main issue is that the product still behaves partly like a job dashboard. CEOs and investors do not want a better job board. They want a strategic readout:

- What is changing?
- Which companies are making new bets?
- Which categories are accelerating?
- What does this imply about markets, capital allocation, competition, and risk?

The product should become a weekly AI market intelligence brief powered by hiring data, with the dashboard acting as evidence behind the narrative.

## Current Strengths

- Clear product thesis in `PRD.md` and `METRICS.md`.
- Working backend scrapers for several high-signal AI companies.
- Supabase snapshot model supports historical trend analysis.
- Frontend already includes useful views: company ranking, heatmap, category bars, locations, company pages.
- Unusual role detection is the right direction. It turns raw job data into interpretation.

## Current Friction

1. The frontend is split between live backend data and mock/generated data.
2. The backend has many endpoint-level aggregations, which makes insight logic scattered.
3. The dashboard still leads with generic metrics like total roles and top location.
4. The `/roles` page is job-board-like, which is not ideal for CEOs and investors.
5. The product needs stronger editorial hierarchy: "what happened, why it matters, what to watch next."
6. There is no visible confidence, methodology, or freshness standard for executive users.

## Simplification Strategy

### 1. Make One Source Of Truth

Remove the mock role generation path from the main product flow.

Recommended direction:

- Backend owns live roles, companies, snapshots, and insight calculations.
- Frontend only renders API responses.
- Keep static JSON only for fallback demo mode or tests.

This simplifies mental load and avoids mismatched numbers between pages.

### 2. Collapse Aggregation Endpoints Into A Single Intelligence Endpoint

Right now the frontend calls multiple endpoints:

- `/companies`
- `/company/{slug}`
- `/category-matrix`
- `/categories/seniority`
- `/unusual-signals`

For the homepage, create one endpoint:

```text
GET /briefing
```

It should return:

- current period summary
- previous period comparison
- top company moves
- top category moves
- unusual signals
- category by company matrix
- generated insight cards
- freshness metadata

This makes the frontend simpler, faster, and easier to reason about.

### 3. Keep Company Pages, Simplify Roles View

Company pages are useful. Keep them.

The `/roles` page should be reframed from "open roles" to "evidence table."

Instead of optimizing for job browsing, optimize for verification:

- Show the exact roles behind each insight.
- Filter by signal, category, company, country, seniority.
- Add "why this role matters" for flagged roles.

## Make It Interesting For CEOs And Investors

### The Core User Need

CEOs and investors care about strategic movement, not raw hiring volume.

They want to know:

- Which company is shifting strategy?
- Which AI capability is becoming a market-wide priority?
- Which company is building infrastructure, distribution, policy, safety, or domain expertise?
- Where might spend, competition, and enterprise demand move next?
- Which signal is early and non-obvious?

### New Homepage Hierarchy

Replace the current dashboard emphasis with this structure:

1. Weekly Market Read
2. Strategic Moves
3. Category Momentum
4. Company Bet Map
5. Unusual Signals
6. Evidence Table

### 1. Weekly Market Read

Top of the page should read like a short investor memo.

Example:

```text
This week, AI hiring momentum shifted from model research toward infrastructure and enterprise deployment. CoreWeave and xAI account for most new data center and reliability roles, while OpenAI and Anthropic continue adding policy and government-facing roles. The signal: frontier AI companies are moving from pure capability building into deployment, distribution, and compute control.
```

Use 3 bullets below it:

- Biggest acceleration: Infrastructure
- Strongest company move: xAI data center hiring
- Most unusual signal: science tutor roles at xAI

### 2. Strategic Moves

Create a table that speaks executive language.

Columns:

- Company
- Move
- Evidence
- Investor read
- Confidence

Example rows:

| Company | Move | Evidence | Investor read | Confidence |
|---|---|---|---|---|
| xAI | Compute buildout | Data center, power, reliability roles | Scaling training capacity and reducing cloud dependency | High |
| OpenAI | Government expansion | Policy, public sector, national security roles | Enterprise and government revenue channel is becoming more important | Medium |
| Anthropic | Safety-led enterprise push | Safety, policy, trust, enterprise roles | Positioning as regulated enterprise AI provider | Medium |

This is more valuable than "open roles" alone.

### 3. Category Momentum

Categories should become the main lens.

Track:

- current count
- change versus prior period
- number of companies contributing to the change
- seniority mix
- interpretation

Example:

```text
Infrastructure: +42 roles across 5 companies
Interpretation: Compute capacity remains the biggest constraint in frontier AI. Senior-heavy hiring suggests companies are building new systems, not just maintaining existing ones.
```

### 4. Company Bet Map

Keep the heatmap, but add a plain-language label above it:

```text
Where AI companies are placing capital-intensive bets
```

Add a toggle:

- Counts
- Change
- Seniority-weighted signal

For investors, "change" and "seniority-weighted signal" are more valuable than counts.

### 5. Unusual Signals

This is the most differentiated feature.

Make it a first-class section, not just a table cell.

Each signal should have:

- role pattern
- companies affected
- exact role examples
- strategic interpretation
- why it matters

Example:

```text
Science tutors appearing at xAI

Evidence:
- Biology Tutor
- Chemistry Tutor
- Physics Tutor

Read:
These are likely model training and evaluation roles, not education roles. The signal is a deliberate investment in scientific reasoning capability.

Why it matters:
Scientific reasoning is a high-value frontier model benchmark and a potential wedge into research, healthcare, education, and technical enterprise workflows.
```

### 6. Evidence Table

Move the raw roles lower on the page.

Label it:

```text
Evidence behind the signals
```

Columns:

- Role
- Company
- Signal category
- Why it matters
- First seen
- Last seen
- Source

## Better Insight Types

The product should generate insight cards from templates. Start rule-based before using AI.

### Insight Type 1: Strategic Shift

Trigger:

- category count increases meaningfully for one company
- category becomes top 2 for that company

Template:

```text
{Company} appears to be shifting toward {category}. {count} open roles now sit in this area, up {delta} from the prior period. The seniority mix suggests {build_or_scale_read}.
```

### Insight Type 2: Market-Wide Momentum

Trigger:

- category grows across 3 or more companies

Template:

```text
{Category} is becoming a market-wide priority, with {delta} new roles across {company_count} companies. This suggests the theme is not company-specific, but part of a broader industry shift.
```

### Insight Type 3: Unusual Role Pattern

Trigger:

- 2 or more roles match an unusual pattern

Template:

```text
{Company} is hiring for {pattern}. These roles are unusual for a software company and likely signal {interpretation}.
```

### Insight Type 4: Capital Intensity

Trigger:

- growth in data center, energy, infra, supply chain, reliability

Template:

```text
Hiring points to higher capital intensity at {Company}. Roles in {categories} suggest the company is investing in physical compute capacity and operational control.
```

### Insight Type 5: Go-To-Market Maturity

Trigger:

- growth in enterprise sales, solutions, partnerships, customer engineering

Template:

```text
{Company} is moving deeper into commercialization. The rise in {category} roles suggests product-market fit is shifting from experimentation toward repeatable enterprise deployment.
```

## Recommended Product Changes

### High Impact, Low Complexity

1. Rename the app from "AI Insights" to "AI Hiring Signals" in the UI.
2. Replace top metric cards with executive signal cards.
3. Add a "Weekly Market Read" section at the top.
4. Convert the company table into "Strategic Moves."
5. Move raw roles lower and call them evidence.
6. Remove mock/generated roles from production UI.

### Medium Complexity

1. Add `/briefing` endpoint.
2. Add category velocity calculations.
3. Add company-level strategic move detection.
4. Add seniority-weighted signal scoring.
5. Add exact role examples under each unusual signal.

### Higher Complexity

1. Add automated weekly memo generation.
2. Add investor export as PDF or email brief.
3. Add company comparison pages.
4. Add alerts when a company makes a new hiring bet.
5. Add confidence scores based on volume, recency, and repeat evidence.

## Suggested Simplified Architecture

```text
Scrapers
  -> normalize roles
  -> Supabase roles and snapshots
  -> insight engine
  -> /briefing API
  -> frontend executive dashboard
```

### Backend Modules

Recommended structure:

```text
backend/
  main.py
  db.py
  scraper/
  insights/
    category_momentum.py
    unusual_signals.py
    company_moves.py
    briefing.py
```

The goal is to move business logic out of route handlers and into testable insight modules.

## Suggested Data Additions

Add these fields or computed views:

- `first_seen_at`
- `last_seen_at`
- `is_active`
- `period_id`
- `category_delta`
- `company_category_delta`
- `seniority_weight`
- `signal_type`
- `signal_confidence`
- `signal_summary`
- `evidence_role_ids`

## CEO And Investor Dashboard Wireframe

```text
AI Hiring Signals
Last updated: May 27, 2026

[Weekly Market Read]
One paragraph with the market-level interpretation.

[3 Executive Cards]
1. Biggest strategic shift
2. Market-wide momentum
3. Most unusual signal

[Strategic Moves Table]
Company | Move | Evidence | Investor read | Confidence

[Category Momentum]
Category | Change | Companies | Seniority mix | Read

[Company Bet Map]
Heatmap with count/change/seniority toggle

[Unusual Signals]
Narrative cards with exact role evidence

[Evidence Table]
Raw roles supporting the analysis
```

## Priority Roadmap

### Week 1

- Remove mock roles from `/roles`.
- Add `/briefing`.
- Add weekly market read using deterministic templates.
- Rework homepage top section around executive signal cards.

### Week 2

- Add category velocity and company-category velocity.
- Add strategic moves table.
- Promote unusual signals into their own section.
- Add evidence role examples.

### Week 3

- Add confidence scoring.
- Add exportable weekly investor memo.
- Add alert-worthy changes.
- Add basic tests around insight generation.

## Final Recommendation

Do not add more charts yet. The product needs sharper interpretation, not more visualization.

The winning version is:

```text
Bloomberg-style intelligence for AI company strategy, inferred from hiring data.
```

Make the homepage feel like a weekly analyst briefing with data behind every claim. That will make it much more compelling for CEOs and investors than a generic hiring dashboard.
