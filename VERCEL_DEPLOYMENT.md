# Vercel Deployment

Deploy as two Vercel projects.

## Backend Project

- Root directory: `backend`
- Framework preset: Other
- Build/runtime: Vercel Python
- Required env vars:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `SCRAPE_SECRET`
  - `ALLOWED_ORIGINS=https://your-frontend-project.vercel.app`

After deploy, test:

```bash
curl https://your-backend-project.vercel.app/
curl https://your-backend-project.vercel.app/briefing
```

## Frontend Project

- Root directory: `frontend`
- Framework preset: Next.js
- Required env vars:
  - `NEXT_PUBLIC_API_URL=https://ai-company-hiring-insights.vercel.app`
  - `NEXT_PUBLIC_LOGO_DEV_TOKEN`

After deploy, update backend `ALLOWED_ORIGINS` to the final frontend URL.
