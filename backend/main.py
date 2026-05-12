import logging
from datetime import datetime, timezone

from fastapi import FastAPI
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
    return []


@app.get("/company/{slug}")
def get_company(slug: str):
    return {}
