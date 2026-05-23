# What Metrics Matter Most

> The app's core purpose: tell people where AI is headed by tracking what roles AI companies are hiring for.

## Signal Ranking

### 1. Job Category — Most Important

This is the clearest signal of *where AI is headed*. Category tells you what AI companies are actually investing in:

- Spike in **Infrastructure / Data Center** → companies need more compute capacity → model scale is the bet
- Spike in **Government & Defense** → AI is going into national security
- Spike in **Safety & Policy** → regulatory pressure is forcing structural change
- Spike in **Enterprise Sales** → AI has shifted from research to commercialization

**Category = what they're building toward.**

---

### 2. Seniority Mix — Underrated Signal

If a company suddenly hires 10 *Staff / Principal* engineers in Robotics, they're not experimenting — they're committing.

- **Junior hires** = scaling something that already works
- **Senior hires** = building something new

This is not surfaced in the UI yet and is worth adding.

---

### 3. Rate of Change (WoW %) — More Important Than Absolute Count

A company going from 50 → 100 roles is a bigger signal than one sitting at 500.  
The *velocity* matters more than the total.

> Current gap: the app shows category counts but not category *velocity* (e.g. "Infrastructure is up 40% across all companies this week").

---

### 4. Location — Secondary Signal

Tells you *where geographically* AI is expanding (e.g. UAE spike = Gulf sovereign wealth money flowing in), but it's a consequence of strategy, not the strategy itself.

---

### 5. Company — Context, Not Signal

Which company is hiring most just tells you who has the most funding, not necessarily where AI is heading. Useful as a filter, not as a headline metric.

---

## Summary

| Priority | Metric | What it tells you |
|---|---|---|
| 1 | Job Category | What AI companies are strategically betting on |
| 2 | Seniority Mix | Whether a bet is exploratory or committed |
| 3 | WoW % change | Velocity and momentum of a trend |
| 4 | Location | Geographic expansion strategy |
| 5 | Company | Who has money, not where AI is going |

## Key Insight for Product Direction

The app should lead with **category trends over time** — not just counts, but rate of change per category across all companies. That's the narrative that actually answers "where is AI headed?"

---

## Visual Suggestions — How to Show It

Ordered by how little the existing UI needs to change.

---

### Suggestion 1 — Delta Badges on Category Bars Easiest, highest impact

**Where:** The existing "Role categories growing fastest" section already has horizontal bars per category.

**Change:** Add a small colored pill to the right of each bar showing the role count delta — e.g. `+47` in teal if up, `-12` in gray if down.

**Why it works:** Zero layout change. One new data point per row. Immediately readable. The user sees at a glance that Infrastructure jumped but Safety & Policy is flat.

**Needs:** A second snapshot in the DB (7+ days old) to compute the delta.

**UI copy:**
> "Role categories growing fastest" → stays the same
> Each row: `[Category name] ████████░░ 312  +47 ↑`

---

### Suggestion 2 — Narrative Insight Cards (right sidebar) Medium effort

**Where:** The 3 insight cards on the right ("Biggest spike this week", "Most unusual new role", "Geography shift") are all currently empty placeholders.

**Change:** Auto-generate text from real data for each card:
- "Biggest spike this week" → `"Infrastructure roles up 34% across 4 companies. CoreWeave leads."`
- "Most unusual new role" → `"'National Security Account Lead' appeared at 3 companies simultaneously."`
- "Geography shift" → `"UAE now #3 hiring location, up from #6 last month."`

**Why it works:** This is the editorial voice the app needs. It interprets the data *for* the user instead of making them read raw numbers. Fits the existing card layout exactly.

**Needs:** Simple string templates that pull from live API data — no new UI components.

**UI copy suggestion for card labels:**
> "What jumped this week" / "Unusual signal" / "Where the map is shifting"

---

### Suggestion 3 — Seniority Split Bar per Category Medium effort

**Where:** In the "Role categories growing fastest" section, or as a new expandable row.

**Change:** For each category, show the bar split into two segments: Junior/Mid vs Senior/Staff/Lead. Color-coded — lighter shade = junior, darker = senior.

**Why it works:** Turns a count into a strategic signal. "Infrastructure: 300 roles, 70% senior" reads as "they're building, not just scaling." Requires no new page, no new route.

**Needs:** `seniority` is already scraped and stored. Just needs a grouping query in the backend.

**UI copy:**
> Column header: `Seniority split`
> Tooltip: `"Senior-heavy hiring signals a new capability build, not just headcount growth"`

---

### Suggestion 4 — Category × Company Heatmap More effort, very powerful

**Where:** A new section below the main company table, or a dedicated `/signals` page.

**What:** A grid where rows = categories (8–10), columns = companies (6). Each cell shows role count, colored by intensity (light = few, dark = many). Optionally add a small sparkline inside each cell.

**Why it works:** Instantly shows concentration — if every company is dark in "Infrastructure" but only one is dark in "Robotics", the pattern is obvious at a glance. This is the kind of chart that gets shared.

**Needs:** No new scraping. Just a new React component and one new backend aggregation query.

**UI copy:**
> Section title: `"Where each company is placing its bets"`
> Subtitle: `"Role concentration by category, updated on each scrape run"`

---

### Suggestion 5 — Category Momentum Card (replaces or extends top metric cards) Easy

**Where:** The 5 metric cards at the top.

**Change:** Replace "Top hiring location" (which is low-signal, as noted above) with a "Hot category" card that shows the single fastest-growing category by WoW role count.

**Why it works:** Surfaces the #1 signal (category velocity) at the very top of the page, immediately visible without scrolling.

**UI copy:**
> Label: `"Momentum category"`
> Value: `"Infrastructure"`
> Change: `"+82 roles this week across all companies"`
> Detail: `"The single category growing fastest right now."`

---

## Recommended Build Order

1. **Suggestion 5** (swap metric card) — 30 min, no new UI
2. **Suggestion 1** (delta badges on bars) — 1–2 hrs, needs 7-day DB history
3. **Suggestion 2** (narrative insight cards) — 2–3 hrs, high storytelling value
4. **Suggestion 3** (seniority split) — 3–4 hrs, underrated signal
5. **Suggestion 4** (heatmap) — 1–2 days, most shareable visual
