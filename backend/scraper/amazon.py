"""
Amazon Jobs scraper filtering for 'AGI'.
API pattern: https://www.amazon.jobs/en/search.json
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

COMPANY_SLUG = "amazonagi"
AMAZON_API = "https://www.amazon.jobs/en/search.json"
BASE_URL = "https://www.amazon.jobs"


def scrape() -> list[RoleSchema]:
    """Fetch Amazon AGI jobs and return RoleSchema objects."""
    logger.info("[%s] Fetching jobs from %s", COMPANY_SLUG, AMAZON_API)

    roles: list[RoleSchema] = []
    offset = 0
    limit = 100

    while True:
        try:
            params = {
                "business_category[]": ["AGI"],
                "offset": offset,
                "result_limit": limit,
                "sort": "recent"
            }
            with httpx.Client(timeout=30) as client:
                response = client.get(AMAZON_API, params=params, headers={"Accept-Encoding": "identity"})
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError as exc:
            logger.error("[%s] HTTP error %s: %s", COMPANY_SLUG, exc.response.status_code, exc)
            break
        except Exception as exc:
            logger.error("[%s] Failed to fetch Amazon jobs: %s", COMPANY_SLUG, exc)
            break

        jobs = data.get("jobs", [])
        if not jobs:
            break

        for job in jobs:
            try:
                title: str = job.get("title", "").strip()
                job_path: str = job.get("job_path", "")
                
                if not title or not job_path:
                    continue
                    
                source_url = f"{BASE_URL}{job_path}"
                location: str = job.get("normalized_location", "") or job.get("location", "") or ""

                work_mode = infer_work_mode(location)

                roles.append(
                    RoleSchema(
                        title=title,
                        source_url=source_url,
                        category=infer_category("", title),
                        location=location or None,
                        country=infer_country(location),
                        seniority=infer_seniority(title),
                        work_mode=work_mode,
                    )
                )
            except Exception as exc:
                logger.warning("[%s] Skipping malformed posting: %s", COMPANY_SLUG, exc)
                continue

        total_hits = data.get("hits", 0)
        offset += limit
        
        if offset >= total_hits:
            break

    logger.info("[%s] Parsed %d valid roles", COMPANY_SLUG, len(roles))
    return roles
