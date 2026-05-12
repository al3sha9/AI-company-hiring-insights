# AI Hiring Signals

Minimal public dashboard prototype for reading AI company strategy through hiring activity.

## Run locally

```bash
pnpm install
pnpm dev
```

The app uses local mock JSON data from `data/` and does not require a backend.

## Notes

- Homepage prioritizes the above-the-fold signal: total roles, growth, fastest company, fastest category, location spike, and the company ranking.
- Company detail pages live at `/company/[slug]`.
- Methodology copy is included in the footer.
