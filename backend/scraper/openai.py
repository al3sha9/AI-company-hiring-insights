"""
OpenAI scraper using the Ashby public API.
API: https://api.ashbyhq.com/posting-api/job-board/openai
Returns JSON with a "jobs" array.
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

COMPANY_SLUG = "openai"
ASHBY_API = "https://api.ashbyhq.com/posting-api/job-board/openai"


def scrape() -> list[RoleSchema]:
    """Fetch all OpenAI jobs from Ashby and return RoleSchema objects."""
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

    # OpenAI's Ashby board uses "jobs" (not "jobPostings")
    job_postings = data.get("jobs", [])

    if not isinstance(job_postings, list):
        logger.error("[%s] Unexpected Ashby response format", COMPANY_SLUG)
        return []

    logger.info("[%s] Fetched %d postings", COMPANY_SLUG, len(job_postings))

    roles: list[RoleSchema] = []
    for job in job_postings:
        try:
            title: str = job.get("title", "").strip()
            source_url: str = job.get("jobUrl", "")

            if not title or not source_url:
                continue

            # Ashby OpenAI schema: location is a string, department is a string
            location: str = job.get("location", "") or ""
            department: str = job.get("department", "") or ""
            team: str = job.get("team", "") or ""

            # workplaceType: "Remote", "Hybrid", "OnSite"
            workplace_type: str = job.get("workplaceType", "") or ""
            work_mode = infer_work_mode(f"{location} {workplace_type}")

            roles.append(
                RoleSchema(
                    title=title,
                    source_url=source_url,
                    category=infer_category(f"{department} {team}", title),
                    location=location or None,
                    country=infer_country(location),
                    seniority=infer_seniority(title),
                    work_mode=work_mode,
                )
            )
        except Exception as exc:
            logger.warning("[%s] Skipping malformed posting: %s", COMPANY_SLUG, exc)
            continue

    logger.info("[%s] Parsed %d valid roles", COMPANY_SLUG, len(roles))
    return roles
