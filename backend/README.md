Backend scripts are now local-only.

Use this directory for:

- scraping company careers pages
- rebuilding Supabase read models
- reclassifying role categories
- triggering frontend revalidation after a weekly refresh
- running local maintenance commands instead of production admin routes

Main weekly command:

```bash
python run_weekly_refresh.py
```

Other local commands:

```bash
python rebuild_read_models.py
python reset_roles.py
python scrape_audit.py
```
