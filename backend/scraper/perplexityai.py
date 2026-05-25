"""
Perplexity scraper using the Ashby public API.
API: https://api.ashbyhq.com/posting-api/job-board/perplexity
Returns JSON with a "jobPostings" array.
"""

import logging
import httpx
from scraper import RoleSchema
from scraper.greenhouse import (
    infer_category,
    infer_country,
    infer_seniority,
    infer_work_mode,
)

logger = logging.getLogger(__name__)

COMPANY_SLUG = "perplexityai"
ASHBY_API = "https://api.ashbyhq.com/posting-api/job-board/perplexity"


def scrape() -> list[RoleSchema]:
    """Fetch all Perplexity jobs from Ashby and return RoleSchema objects."""
    logger.info("[%s] Fetching Ashby jobs from %s", COMPANY_SLUG, ASHBY_API)

    try:
        with httpx.Client(timeout=30) as client:
            response = client.get(ASHBY_API)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error("[%s] HTTP error %s: %s", COMPANY_SLUG, exc.response.status_code, exc)
        return []
    except Exception as exc:
        logger.error("[%s] Failed to fetch Ashby jobs: %s", COMPANY_SLUG, exc)
        return []

    # Ashby boards differ: OpenAI uses "jobs", Perplexity also uses "jobs" (not "jobPostings")
    job_postings = data.get("jobs") or data.get("jobPostings") or []
    logger.info("[%s] Fetched %d postings", COMPANY_SLUG, len(job_postings))

    roles: list[RoleSchema] = []
    for job in job_postings:
        try:
            title: str = job.get("title", "").strip()
            source_url: str = job.get("jobUrl", "")

            if not title or not source_url:
                continue

            location: str = job.get("location", "") or ""
            department: str = job.get("department", "") or ""

            roles.append(
                RoleSchema(
                    title=title,
                    source_url=source_url,
                    category=infer_category(department, title),
                    location=location or None,
                    country=infer_country(location),
                    seniority=infer_seniority(title),
                    work_mode=infer_work_mode(location),
                )
            )
        except Exception as exc:
            logger.warning("[%s] Skipping malformed posting: %s", COMPANY_SLUG, exc)
            continue

    logger.info("[%s] Parsed %d valid roles", COMPANY_SLUG, len(roles))
    return roles
