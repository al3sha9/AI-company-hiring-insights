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
  - `UPSTASH_REDIS_REST_URL` (optional, free Upstash Redis cache)
  - `UPSTASH_REDIS_REST_TOKEN` (optional, free Upstash Redis cache)

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
