"""
Mistral scraper using the Lever public API.
Lever API pattern: https://api.lever.co/v0/postings/{company_id}?mode=json
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

COMPANY_SLUG = "mistral"
LEVER_COMPANY_ID = "mistral"
LEVER_API = f"https://api.lever.co/v0/postings/{LEVER_COMPANY_ID}?mode=json"


def scrape() -> list[RoleSchema]:
    """Fetch all Mistral jobs from Lever and return RoleSchema objects."""
    logger.info("[%s] Fetching Lever jobs from %s", COMPANY_SLUG, LEVER_API)

    try:
        with httpx.Client(timeout=30) as client:
            response = client.get(LEVER_API)
            response.raise_for_status()
            jobs = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error("[%s] HTTP error %s: %s", COMPANY_SLUG, exc.response.status_code, exc)
        return []
    except Exception as exc:
        logger.error("[%s] Failed to fetch Lever jobs: %s", COMPANY_SLUG, exc)
        return []

    if not isinstance(jobs, list):
        logger.error("[%s] Unexpected Lever response format", COMPANY_SLUG)
        return []

    logger.info("[%s] Fetched %d postings", COMPANY_SLUG, len(jobs))

    roles: list[RoleSchema] = []
    for job in jobs:
        try:
            title: str = job.get("text", "").strip()
            source_url: str = job.get("hostedUrl", "")

            if not title or not source_url:
                continue

            # Lever nests metadata under "categories"
            categories: dict = job.get("categories", {})
            location: str = categories.get("location", "") or ""
            team: str = categories.get("team", "") or ""
            department: str = categories.get("department", "") or ""
            commitment: str = categories.get("commitment", "") or ""  # e.g. "Full-time"

            # Work mode: Lever sometimes puts it in commitment or location
            work_mode = infer_work_mode(f"{location} {commitment}")

            roles.append(
                RoleSchema(
                    title=title,
                    source_url=source_url,
                    category=infer_category(f"{team} {department}", title),
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
