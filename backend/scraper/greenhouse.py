"""
Greenhouse public JSON API scraper utility.
API pattern: https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
"""

import logging
import httpx
from scraper import RoleSchema

logger = logging.getLogger(__name__)

GREENHOUSE_API = "https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true"

# ---------------------------------------------------------------------------
# Country inference
# ---------------------------------------------------------------------------

COUNTRY_PATTERNS: list[tuple[list[str], str]] = [
    (["United States", " US,", " US ", "(US)", "USA", ", CA", ", NY", ", WA",
      "San Francisco", "New York", "Seattle", "Austin", "Washington DC",
      "Palo Alto", "Santa Clara", "Los Angeles", "Chicago", "Boston",
      "Memphis", "Mountain View"], "US"),
    (["United Kingdom", " UK", "London", "Cambridge", "Oxford", "Edinburgh"], "UK"),
    (["France", "Paris", "Lyon"], "France"),
    (["Canada", "Toronto", "Vancouver", "Ottawa", "Montreal"], "Canada"),
    (["Singapore"], "Singapore"),
    (["India", "Bangalore", "Hyderabad", "Mumbai", "Delhi", "Bengaluru"], "India"),
    (["UAE", "Dubai", "Abu Dhabi"], "UAE"),
    (["Germany", "Berlin", "Munich"], "Germany"),
    (["Netherlands", "Amsterdam"], "Netherlands"),
    (["Australia", "Sydney", "Melbourne"], "Australia"),
]


def infer_country(location: str) -> str | None:
    if not location:
        return None
    for patterns, country in COUNTRY_PATTERNS:
        for pattern in patterns:
            if pattern.lower() in location.lower():
                return country
    return None


# ---------------------------------------------------------------------------
# Work mode inference
# ---------------------------------------------------------------------------

def infer_work_mode(location: str) -> str:
    if not location:
        return "Onsite"
    loc_lower = location.lower()
    if "remote" in loc_lower:
        return "Remote"
    if "hybrid" in loc_lower:
        return "Hybrid"
    return "Onsite"


# ---------------------------------------------------------------------------
# Seniority inference
# ---------------------------------------------------------------------------

SENIOR_KEYWORDS = [
    "senior", "staff", "principal", "lead", "director",
    "vp ", "vice president", "head of", "manager", "distinguished",
]
JUNIOR_KEYWORDS = ["junior", "associate", "entry", "intern", "graduate"]


def infer_seniority(title: str) -> str:
    title_lower = title.lower()
    for kw in SENIOR_KEYWORDS:
        if kw in title_lower:
            return "Senior"
    for kw in JUNIOR_KEYWORDS:
        if kw in title_lower:
            return "Junior"
    return "Mid"


# ---------------------------------------------------------------------------
# Category mapping from Greenhouse department names
# ---------------------------------------------------------------------------

CATEGORY_KEYWORDS: list[tuple[list[str], str]] = [
    (["research", "scientist", "ml ", "machine learning", "alignment", "evals",
      "post-training", "pretraining", "multimodal"], "Research"),
    (["infrastructure", "infra", "gpu", "cluster", "inference", "training infra",
      "distributed systems", "reliability", "sre", "devops", "platform"], "Infrastructure"),
    (["data center", "datacenter", "energy", "power", "facilities"], "Data Center & Energy"),
    (["robotics", "robot", "manipulation", "controls", "actuation",
      "humanoid", "locomotion"], "Robotics"),
    (["safety", "policy", "trust", "responsible ai", "governance",
      "compliance", "ethics"], "Safety & Policy"),
    (["government", "defense", "public sector", "national security",
      "federal", "military"], "Government & Defense"),
    (["enterprise", "sales", "account", "partnerships", "revenue",
      "business development", "solutions architect"], "Enterprise Sales"),
    (["product", "designer", "ux", "ui "], "Product"),
    (["marketing", "communications", "brand", "growth", "developer relations",
      "devrel", "content"], "Marketing"),
    (["operations", "people", "hr", "recruiting", "finance", "legal",
      "supply chain", "program manager", "tpm", "facilities"], "Operations"),
    (["engineer", "software", "backend", "frontend", "fullstack", "full-stack",
      "developer", "api", "systems", "data engineer"], "Engineering"),
]


def infer_category(department_name: str, title: str) -> str:
    text = f"{department_name} {title}".lower()
    for keywords, category in CATEGORY_KEYWORDS:
        for kw in keywords:
            if kw in text:
                return category
    return "Engineering"  # sensible default


# ---------------------------------------------------------------------------
# Core scraping function
# ---------------------------------------------------------------------------

def scrape_greenhouse(board_token: str, company_slug: str) -> list[RoleSchema]:
    """
    Fetch all jobs from a Greenhouse board and return them as RoleSchema objects.
    Returns an empty list on any error.
    """
    url = GREENHOUSE_API.format(board_token=board_token)
    logger.info("[%s] Fetching Greenhouse jobs from %s", company_slug, url)

    try:
        with httpx.Client(timeout=30) as client:
            response = client.get(url)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error("[%s] HTTP error %s: %s", company_slug, exc.response.status_code, exc)
        return []
    except Exception as exc:
        logger.error("[%s] Failed to fetch Greenhouse jobs: %s", company_slug, exc)
        return []

    jobs = data.get("jobs", [])
    logger.info("[%s] Fetched %d jobs", company_slug, len(jobs))

    roles: list[RoleSchema] = []
    for job in jobs:
        try:
            title: str = job.get("title", "").strip()
            source_url: str = job.get("absolute_url", "")

            if not title or not source_url:
                continue

            # Location — Greenhouse returns {"name": "..."} nested object
            location_obj = job.get("location", {})
            location: str = location_obj.get("name", "") if isinstance(location_obj, dict) else ""

            # Department — list of {"name": "..."}
            departments: list[dict] = job.get("departments", [])
            department_name: str = departments[0]["name"] if departments else ""

            roles.append(
                RoleSchema(
                    title=title,
                    source_url=source_url,
                    category=infer_category(department_name, title),
                    location=location or None,
                    country=infer_country(location),
                    seniority=infer_seniority(title),
                    work_mode=infer_work_mode(location),
                )
            )
        except Exception as exc:
            logger.warning("[%s] Skipping malformed job entry: %s", company_slug, exc)
            continue

    logger.info("[%s] Parsed %d valid roles", company_slug, len(roles))
    return roles
