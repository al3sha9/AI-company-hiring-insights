import logging
import os
from datetime import datetime, timezone, timedelta
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware

from db import supabase
import scraper.anthropic as anthropic_scraper
import scraper.openai as openai_scraper
import scraper.perplexityai as perplexityai_scraper
import scraper.xai as xai_scraper
import scraper.coreweave as coreweave_scraper
import scraper.mistral as mistral_scraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registry of all active scrapers: (company_slug, scraper_module)
SCRAPERS: list[tuple[str, object]] = [
    ("anthropic", anthropic_scraper),
    ("openai", openai_scraper),
    ("perplexityai", perplexityai_scraper),
    ("xai", xai_scraper),
    ("coreweave", coreweave_scraper),
    ("mistral", mistral_scraper),
]


@app.get("/")
def health_check():
    return {"status": "ok"}


def _scrape_one(company_slug: str, scraper_module, scraped_at: str) -> dict:
    """
    Run a single scraper, upsert results, and write logs.
    Returns a summary dict. Designed to be called from a thread pool.
    """
    logger.info("Starting scrape for: %s", company_slug)
    try:
        roles = scraper_module.scrape()
        roles_found = len(roles)

        # Upsert each role into the roles table
        if roles:
            rows = [
                {
                    "company_slug": company_slug,
                    "title": role.title,
                    "category": role.category,
                    "location": role.location,
                    "country": role.country,
                    "seniority": role.seniority,
                    "work_mode": role.work_mode,
                    "source_url": role.source_url,
                    "first_seen_at": scraped_at,
                    "last_seen_at": scraped_at,
                }
                for role in roles
            ]
            supabase.table("roles").upsert(
                rows,
                on_conflict="company_slug,source_url",
            ).execute()

        # Only insert a snapshot when we actually fetched data.
        # Writing a 0-role snapshot on a transient network error would
        # corrupt the trend chart and WoW change calculation.
        if roles_found > 0:
            supabase.table("role_snapshots").insert(
                {
                    "company_slug": company_slug,
                    "scraped_at": scraped_at,
                    "total_open_roles": roles_found,
                }
            ).execute()

        # Log success
        supabase.table("scrape_logs").insert(
            {
                "company_slug": company_slug,
                "status": "success",
                "roles_found": roles_found,
                "scraped_at": scraped_at,
            }
        ).execute()

        logger.info("[%s] Done — %d roles", company_slug, roles_found)
        return {"company": company_slug, "status": "success", "roles_found": roles_found}

    except Exception as exc:
        logger.error("[%s] Scraper failed: %s", company_slug, exc)

        # Log failure — best-effort, don't let a log write crash the thread
        try:
            supabase.table("scrape_logs").insert(
                {
                    "company_slug": company_slug,
                    "status": "error",
                    "roles_found": 0,
                    "scraped_at": scraped_at,
                    "error_message": str(exc),
                }
            ).execute()
        except Exception as log_exc:
            logger.error("[%s] Failed to write error log: %s", company_slug, log_exc)

        return {"company": company_slug, "status": "error", "error": str(exc)}


@app.post("/scrape/run")
def trigger_scrape(authorization: str = Header(None)):
    """
    Run all scrapers in parallel, upsert roles into Supabase, and log results.
    Each scraper runs in its own thread — a failure in one does not stop the others.
    All scrapers run concurrently so total time ≈ slowest single scraper (~30s),
    not the sum of all scrapers.
    """
    scrape_secret = os.getenv("SCRAPE_SECRET")
    if scrape_secret and authorization != f"Bearer {scrape_secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    scraped_at = datetime.now(timezone.utc).isoformat()
    summary: list[dict] = []

    with ThreadPoolExecutor(max_workers=len(SCRAPERS)) as executor:
        futures = {
            executor.submit(_scrape_one, slug, module, scraped_at): slug
            for slug, module in SCRAPERS
        }
        for future in as_completed(futures):
            summary.append(future.result())

    return {"scraped_at": scraped_at, "results": summary}


@app.get("/companies")
def get_companies():
    companies_res = supabase.table("companies").select("*").execute()
    companies = companies_res.data

    # Fetch recent snapshots only — avoid loading the entire history table.
    # Ordered desc so index 0 is always the most recent snapshot per company.
    snapshots_res = (
        supabase.table("role_snapshots")
        .select("*")
        .order("scraped_at", desc=True)
        .limit(500)
        .execute()
    )
    snapshots = snapshots_res.data

    now = datetime.now(timezone.utc)
    target_date = now - timedelta(days=14)

    result = []
    for comp in companies:
        slug = comp["slug"]
        comp_snaps = [s for s in snapshots if s["company_slug"] == slug]

        if not comp_snaps:
            result.append({
                "slug": slug,
                "name": comp["name"],
                "current_roles": 0,
                "previous_roles": 0,
                "change": 0,
                "change_pct": 0.0,
                "scraped_at": None
            })
            continue

        latest_snap = comp_snaps[0]
        current_roles = latest_snap["total_open_roles"]
        scraped_at_str = latest_snap["scraped_at"]

        # Exclude the latest snapshot from the comparison pool so we don't
        # compare a company to itself when there's only one scrape run.
        comparison_snaps = comp_snaps[1:]
        previous_roles = current_roles  # default: no history yet

        if comparison_snaps:
            try:
                closest_snap = min(
                    comparison_snaps,
                    key=lambda s: abs(
                        (
                            datetime.fromisoformat(s["scraped_at"].replace("Z", "+00:00"))
                            - target_date
                        ).total_seconds()
                    ),
                )
                previous_roles = closest_snap["total_open_roles"]
            except (ValueError, KeyError):
                pass

        change = current_roles - previous_roles
        change_pct = 0.0
        if previous_roles > 0:
            change_pct = round((change / previous_roles) * 100, 1)

        result.append({
            "slug": slug,
            "name": comp["name"],
            "current_roles": current_roles,
            "previous_roles": previous_roles,
            "change": change,
            "change_pct": change_pct,
            "scraped_at": scraped_at_str
        })

    return result


@app.get("/company/{slug}")
def get_company(slug: str):
    comp_res = supabase.table("companies").select("*").eq("slug", slug).execute()
    if not comp_res.data:
        raise HTTPException(status_code=404, detail="Company not found")

    comp = comp_res.data[0]

    snaps_res = (
        supabase.table("role_snapshots")
        .select("scraped_at, total_open_roles")
        .eq("company_slug", slug)
        .order("scraped_at")
        .limit(100)
        .execute()
    )

    roles_res = supabase.table("roles").select("*").eq("company_slug", slug).execute()
    roles = roles_res.data

    categories = Counter()
    countries = Counter()

    for r in roles:
        cat = r.get("category") or "Uncategorized"
        country = r.get("country") or "Unknown"
        categories[cat] += 1
        countries[country] += 1

    categories_list = [{"category": k, "count": v} for k, v in categories.items()]
    countries_list = [{"country": k, "count": v} for k, v in countries.items()]

    categories_list.sort(key=lambda x: x["count"], reverse=True)
    countries_list.sort(key=lambda x: x["count"], reverse=True)

    sorted_roles = sorted(roles, key=lambda x: x.get("last_seen_at") or "", reverse=True)[:50]

    return {
        "slug": comp["slug"],
        "name": comp["name"],
        "snapshots": snaps_res.data,
        "categories": categories_list,
        "countries": countries_list,
        "roles": sorted_roles
    }


@app.get("/categories")
def get_categories():
    roles_res = supabase.table("roles").select("category").execute()

    categories = Counter()
    for r in roles_res.data:
        cat = r.get("category") or "Uncategorized"
        categories[cat] += 1

    result = [{"category": k, "count": v} for k, v in categories.items()]
    result.sort(key=lambda x: x["count"], reverse=True)

    return result
