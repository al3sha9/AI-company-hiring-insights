# Vercel Deployment

Deploy only the frontend as a Vercel project.

## Frontend Project

- Root directory: `frontend`
- Framework preset: Next.js
- Required env vars:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `REVALIDATE_SECRET`
  - `NEXT_PUBLIC_LOGO_DEV_TOKEN`
- Optional compatibility env:
  - `SUPABASE_KEY` if you are still rotating to `SUPABASE_SERVICE_ROLE_KEY`

## Data Refresh Flow

The Python scraper is no longer deployed. It runs locally, writes fresh data into Supabase, rebuilds the read-model tables, and then calls the frontend revalidation route.

Typical weekly flow:

```bash
cd backend
python run_weekly_refresh.py
```

After that, the live frontend should pick up the new data without a code push.
