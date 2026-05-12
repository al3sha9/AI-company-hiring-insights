import logging
from datetime import datetime, timezone, timedelta
from collections import Counter

from fastapi import FastAPI, HTTPException
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


@app.post("/scrape/run")
def trigger_scrape():
    """
    Run all scrapers, upsert roles into Supabase, and log results.
    Each scraper runs independently — a failure in one does not stop the others.
    """
    scraped_at = datetime.now(timezone.utc).isoformat()
    summary: list[dict] = []

    for company_slug, scraper_module in SCRAPERS:
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

            # Insert snapshot
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
            summary.append({"company": company_slug, "status": "success", "roles_found": roles_found})

        except Exception as exc:
            logger.error("[%s] Scraper failed: %s", company_slug, exc)

            # Log failure — best-effort, don't let a log write crash the loop
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

            summary.append({"company": company_slug, "status": "error", "error": str(exc)})

    return {"scraped_at": scraped_at, "results": summary}


@app.get("/companies")
def get_companies():
    companies_res = supabase.table("companies").select("*").execute()
    companies = companies_res.data
    
    snapshots_res = supabase.table("role_snapshots").select("*").order("scraped_at", desc=True).execute()
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
        
        closest_snap = None
        min_diff = float("inf")
        
        for s in comp_snaps:
            try:
                # Handle ISO format parsing
                s_date = datetime.fromisoformat(s["scraped_at"].replace("Z", "+00:00"))
                diff = abs((s_date - target_date).total_seconds())
                if diff < min_diff:
                    min_diff = diff
                    closest_snap = s
            except ValueError:
                continue
                
        previous_roles = closest_snap["total_open_roles"] if closest_snap else current_roles
        
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
    
    snaps_res = supabase.table("role_snapshots").select("scraped_at, total_open_roles").eq("company_slug", slug).order("scraped_at").execute()
    
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
