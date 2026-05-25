"""
Nvidia scraper using the Workday public API.
API pattern: https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs
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

COMPANY_SLUG = "nvidia"
WORKDAY_API = "https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs"
EXTERNAL_BASE_URL = "https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite"


def scrape() -> list[RoleSchema]:
    """Fetch all Nvidia jobs from Workday and return RoleSchema objects."""
    logger.info("[%s] Fetching Workday jobs from %s", COMPANY_SLUG, WORKDAY_API)

    roles: list[RoleSchema] = []

    with httpx.Client(timeout=30) as client:
        # Step 1: Fetch facets to bypass the 2000-job hard limit
        try:
            init_res = client.post(
                WORKDAY_API, 
                json={"appliedFacets": {}, "limit": 1, "offset": 0, "searchText": ""},
                headers={"Accept": "application/json"}
            )
            init_res.raise_for_status()
            facets = init_res.json().get("facets", [])
        except Exception as exc:
            logger.error("[%s] Failed to fetch initial facets: %s", COMPANY_SLUG, exc)
            return []
            
        category_ids = []
        for f in facets:
            if f.get("facetParameter") == "jobFamilyGroup":
                category_ids = [v["id"] for v in f.get("values", [])]
                break
                
        if not category_ids:
            logger.warning("[%s] No jobFamilyGroup facets found, fallback to un-faceted search", COMPANY_SLUG)
            category_ids = [None]
            
        # Step 2: Scrape each category
        for cat_id in category_ids:
            offset = 0
            limit = 20
            total_jobs = 0
            
            while True:
                try:
                    payload = {
                        "appliedFacets": {"jobFamilyGroup": [cat_id]} if cat_id else {},
                        "limit": limit,
                        "offset": offset,
                        "searchText": ""
                    }
                    response = client.post(WORKDAY_API, json=payload, headers={"Accept": "application/json"})
                    response.raise_for_status()
                    data = response.json()
                except Exception as exc:
                    logger.error("[%s] Failed to fetch Workday jobs: %s", COMPANY_SLUG, exc)
                    break
    
                job_postings = data.get("jobPostings", [])
                if not job_postings:
                    break
    
                for job in job_postings:
                    try:
                        title: str = job.get("title", "").strip()
                        external_path: str = job.get("externalPath", "")
                        
                        if not title or not external_path:
                            continue
                            
                        source_url = f"{EXTERNAL_BASE_URL}{external_path}"
                        location: str = job.get("locationsText", "") or ""
                        
                        # Workday returns "2 Locations" when there are multiple locations.
                        # We can extract the primary location from the externalPath URL instead.
                        if "Locations" in location and external_path.startswith("/job/"):
                            # e.g. /job/US-CA-Santa-Clara/Senior-Engineer...
                            parts = external_path.split("/")
                            if len(parts) > 2:
                                location = parts[2].replace("-", ", ")

                        roles.append(
                            RoleSchema(
                                title=title,
                                source_url=source_url,
                                category=infer_category("", title),
                                location=location or None,
                                country=infer_country(location),
                                seniority=infer_seniority(title),
                                work_mode=infer_work_mode(location),
                            )
                        )
                    except Exception as exc:
                        logger.warning("[%s] Skipping malformed posting: %s", COMPANY_SLUG, exc)
                        continue
                
                resp_total = data.get("total", 0)
                if resp_total > 0:
                    total_jobs = resp_total
                
                offset += limit
                
                if offset >= total_jobs:
                    break

    logger.info("[%s] Parsed %d valid roles", COMPANY_SLUG, len(roles))
    return roles
