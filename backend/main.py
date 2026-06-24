import logging
import os
import time
import json
from datetime import datetime, timezone, timedelta
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, TypeVar

from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx

from db import supabase
import scraper.anthropic as anthropic_scraper
import scraper.openai as openai_scraper
import scraper.perplexityai as perplexityai_scraper
import scraper.xai as xai_scraper
import scraper.coreweave as coreweave_scraper
import scraper.mistral as mistral_scraper
import scraper.nvidia as nvidia_scraper
import scraper.amazon as amazonagi_scraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

T = TypeVar("T")
_RESPONSE_CACHE: dict[str, tuple[float, object]] = {}
UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL", "").rstrip("/")
UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")
CACHE_PREFIX = os.getenv("CACHE_PREFIX", "ai-insights-cache")
CACHE_VERSION = "v3"
REDIS_TIMEOUT_SECONDS = 2.0


def _cache_key(name: str, **params) -> str:
    parts = [name]
    for key in sorted(params):
        parts.append(f"{key}={params[key]}")
    return "|".join(parts)


def _redis_enabled() -> bool:
    return bool(UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)


def _redis_key(key: str) -> str:
    return f"{CACHE_PREFIX}:{CACHE_VERSION}:{key}"


def _redis_command(command: list[object]):
    if not _redis_enabled():
        return None
    try:
        response = httpx.post(
            UPSTASH_REDIS_REST_URL,
            headers={"Authorization": f"Bearer {UPSTASH_REDIS_REST_TOKEN}"},
            json=command,
            timeout=REDIS_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return response.json().get("result")
    except Exception as exc:
        logger.warning("Redis cache command failed: %s", exc)
        return None


def cached_response(key: str, ttl_seconds: int, factory: Callable[[], T]) -> T:
    cached = get_cached_response(key)
    if cached is not None:
        return cached  # type: ignore[return-value]

    return set_cached_response(key, ttl_seconds, factory())


def get_cached_response(key: str):
    redis_payload = _redis_command(["GET", _redis_key(key)])
    if redis_payload:
        try:
            return json.loads(redis_payload)
        except json.JSONDecodeError:
            pass

    cached = _RESPONSE_CACHE.get(key)
    if cached and cached[0] > time.time():
        return cached[1]
    return None


def set_cached_response(key: str, ttl_seconds: int, value: T) -> T:
    _RESPONSE_CACHE[key] = (time.time() + ttl_seconds, value)
    _redis_command(["SET", _redis_key(key), json.dumps(value), "EX", ttl_seconds])
    return value


def clear_response_cache() -> None:
    _RESPONSE_CACHE.clear()
    redis_keys = _redis_command(["KEYS", f"{CACHE_PREFIX}:*"])
    if redis_keys:
        _redis_command(["DEL", *redis_keys])


def revalidate_frontend_cache() -> None:
    url = os.getenv("FRONTEND_REVALIDATE_URL", "").strip()
    if not url:
        return

    headers = {}
    secret = os.getenv("REVALIDATE_SECRET", "").strip()
    if secret:
        headers["Authorization"] = f"Bearer {secret}"

    try:
        httpx.post(url, headers=headers, timeout=5)
    except Exception as exc:
        logger.warning("Frontend cache revalidation failed: %s", exc)


def fetch_all_roles(
    columns: str,
    recent_cutoff: str,
    company_slug: str = None,
    country: str = None,
) -> list[dict]:
    """
    Pages through the roles table in 1000-row chunks to bypass Supabase's
    server-side max-rows cap. Retries each page up to 3 times on transient
    HTTP/2 connection drops (RemoteProtocolError) which occur on macOS.
    """
    import time
    PAGE_SIZE = 1000
    all_rows: list[dict] = []
    offset = 0
    while True:
        last_exc = None
        for attempt in range(3):
            try:
                query = (
                    supabase.table("roles")
                    .select(columns)
                    .gte("last_seen_at", recent_cutoff)
                )
                if company_slug:
                    query = query.eq("company_slug", company_slug)
                if country:
                    query = query.eq("country", country)
                
                res = query.range(offset, offset + PAGE_SIZE - 1).execute()
                last_exc = None
                break
            except Exception as exc:
                last_exc = exc
                logger.warning("fetch_all_roles page %d attempt %d failed: %s", offset, attempt + 1, exc)
                time.sleep(0.5 * (attempt + 1))
        if last_exc:
            logger.error("fetch_all_roles giving up at offset %d: %s", offset, last_exc)
            break
        batch = res.data or []
        all_rows.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return all_rows


def recent_cutoff(days: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


def parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def latest_scrape_window_cutoff() -> str:
    latest = (
        supabase.table("role_snapshots")
        .select("scraped_at")
        .order("scraped_at", desc=True)
        .limit(1)
        .execute()
    )
    latest_at = parse_timestamp((latest.data or [{}])[0].get("scraped_at"))
    if latest_at is None:
        return recent_cutoff(7)
    # Scrapers in one run can finish a few minutes apart. A 24h window captures
    # the latest complete scrape batch without pulling old closed roles.
    return (latest_at - timedelta(hours=24)).isoformat()


def effective_role_cutoff(
    days: int,
    company_slug: str | None = None,
    country: str | None = None,
) -> str:
    cutoff = recent_cutoff(days)
    query = supabase.table("roles").select("id").gte("last_seen_at", cutoff).limit(1)
    if company_slug:
        query = query.eq("company_slug", company_slug)
    if country:
        query = query.eq("country", country)

    if query.execute().data:
        return cutoff

    return latest_scrape_window_cutoff()

app = FastAPI()

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:3001",
    ).split(",")
    if origin.strip()
]
allow_all_origins = "*" in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all_origins else allowed_origins,
    allow_credentials=not allow_all_origins,
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
    ("nvidia", nvidia_scraper),
    ("amazonagi", amazonagi_scraper),
]


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "cache_entries": len(_RESPONSE_CACHE),
        "redis_cache": "enabled" if _redis_enabled() else "disabled",
    }


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

    # Run scrapers sequentially to avoid macOS [Errno 35] socket saturation
    # that occurs when 6+ outbound connections fire simultaneously.
    for slug, module in SCRAPERS:
        summary.append(_scrape_one(slug, module, scraped_at))

    clear_response_cache()
    revalidate_frontend_cache()
    return {"scraped_at": scraped_at, "results": summary}


@app.post("/admin/reclassify")
def reclassify_categories(authorization: str = Header(None)):
    """
    Re-runs infer_category() on every role in the DB using the stored title.
    Use this after updating CATEGORY_KEYWORDS to backfill existing rows
    without waiting for a full re-scrape.
    """
    scrape_secret = os.getenv("SCRAPE_SECRET")
    if scrape_secret and authorization != f"Bearer {scrape_secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    from scraper.greenhouse import infer_category

    PAGE_SIZE = 1000
    updated = 0
    offset = 0

    while True:
        res = (
            supabase.table("roles")
            .select("source_url, company_slug, title")
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        batch = res.data or []
        if not batch:
            break

        for role in batch:
            title = role.get("title") or ""
            new_category = infer_category("", title)
            supabase.table("roles").update({"category": new_category}).eq(
                "source_url", role["source_url"]
            ).eq("company_slug", role["company_slug"]).execute()
            updated += 1

        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE

    logger.info("Reclassified %d roles", updated)
    clear_response_cache()
    return {"status": "done", "roles_updated": updated}


@app.post("/admin/reset-roles")
def reset_roles(authorization: str = Header(None)):
    """
    Deletes ALL rows from the roles table so a fresh scrape starts from scratch.
    role_snapshots are preserved for historical trend data.
    Call POST /scrape/run immediately after to repopulate.
    """
    scrape_secret = os.getenv("SCRAPE_SECRET")
    if scrape_secret and authorization != f"Bearer {scrape_secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    # PostgREST requires a filter for DELETE — match every row via a tautology
    res = supabase.table("roles").delete().gte("first_seen_at", "2000-01-01").execute()
    deleted = len(res.data) if res.data else "unknown"
    logger.info("reset-roles: deleted %s rows", deleted)
    clear_response_cache()
    return {
        "status": "done",
        "rows_deleted": deleted,
        "next_step": "POST /scrape/run to repopulate",
    }


@app.get("/admin/scrape-audit")
def scrape_audit(authorization: str = Header(None)):
    """
    Fetches live job counts directly from each company's career page API
    and compares against what's currently in our DB.
    Use this after a fresh scrape to verify capture completeness.
    """
    scrape_secret = os.getenv("SCRAPE_SECRET")
    if scrape_secret and authorization != f"Bearer {scrape_secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    import httpx

    # --- Live counts from career page APIs ---
    def count_greenhouse(board_token: str) -> int | str:
        url = f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=false"
        try:
            with httpx.Client(timeout=20) as client:
                data = client.get(url).raise_for_status().json()
            return len(data.get("jobs", []))
        except Exception as exc:
            return f"error: {exc}"

    def count_ashby(board_token: str) -> int | str:
        url = f"https://api.ashbyhq.com/posting-api/job-board/{board_token}"
        try:
            with httpx.Client(timeout=20) as client:
                data = client.get(url).raise_for_status().json()
            return len(data.get("jobs", []))
        except Exception as exc:
            return f"error: {exc}"

    def count_lever(company_id: str) -> int | str:
        url = f"https://api.lever.co/v0/postings/{company_id}?mode=json"
        try:
            with httpx.Client(timeout=20) as client:
                data = client.get(url).raise_for_status().json()
            return len(data) if isinstance(data, list) else 0
        except Exception as exc:
            return f"error: {exc}"

    # (slug, display_name, fetch_fn)
    SOURCES = [
        ("anthropic",    "Anthropic",   lambda: count_greenhouse("anthropic")),
        ("openai",       "OpenAI",      lambda: count_ashby("openai")),
        ("perplexityai", "Perplexity",  lambda: count_ashby("perplexity")),
        ("xai",          "xAI",         lambda: count_greenhouse("xai")),
        ("coreweave",    "CoreWeave",   lambda: count_greenhouse("coreweave")),
        ("mistral",      "Mistral",     lambda: count_lever("mistral")),
        ("nvidia",       "Nvidia",      lambda: 0), # No single fetch for Nvidia audit since it uses Workday POST
        ("amazonagi",    "Amazon AGI",  lambda: 0), # Amazon requires base_query search API
    ]

    # --- Our DB counts (recent 14 days) ---
    recent_cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    db_rows = fetch_all_roles("company_slug", recent_cutoff)
    db_counts: dict[str, int] = {}
    for r in db_rows:
        slug = r.get("company_slug") or ""
        db_counts[slug] = db_counts.get(slug, 0) + 1

    # --- Build comparison ---
    results = []
    for slug, name, fetch_fn in SOURCES:
        live = fetch_fn()
        captured = db_counts.get(slug, 0)
        if isinstance(live, int):
            gap = live - captured
            pct = round((captured / live) * 100) if live > 0 else 0
            results.append({
                "company": name,
                "live_on_career_page": live,
                "captured_in_db": captured,
                "missing": gap,
                "capture_rate_pct": pct,
                "status": "✅ good" if pct >= 95 else ("⚠️  partial" if pct >= 70 else "❌ low"),
            })
        else:
            results.append({
                "company": name,
                "live_on_career_page": None,
                "captured_in_db": captured,
                "missing": None,
                "capture_rate_pct": None,
                "status": f"⚠️  fetch failed — {live}",
            })

    return {"audited_at": datetime.now(timezone.utc).isoformat(), "results": results}


@app.get("/companies")
def get_companies(
    days: int = Query(7, ge=1, le=365),
    company_slug: str | None = None,
    country: str | None = None,
):
    cache_key = _cache_key("companies", days=days, company_slug=company_slug, country=country)
    cached = get_cached_response(cache_key)
    if cached is not None:
        return cached

    companies_res = supabase.table("companies").select("*").execute()
    companies = companies_res.data
    if company_slug:
        companies = [comp for comp in companies if comp["slug"] == company_slug]

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
    target_date = now - timedelta(days=days)
    active_roles = fetch_all_roles(
        "company_slug, country",
        effective_role_cutoff(days, company_slug=company_slug, country=country),
        company_slug=company_slug,
        country=country,
    )
    role_counts = Counter(role.get("company_slug") for role in active_roles)
    location_counts: dict[str, Counter] = {}
    for role in active_roles:
        slug = role.get("company_slug") or ""
        location_counts.setdefault(slug, Counter())[role.get("country") or "Unknown"] += 1

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
                "scraped_at": None,
                "top_hiring_location": "N/A",
            })
            continue

        latest_snap = comp_snaps[0]
        current_roles = latest_snap["total_open_roles"]
        if country:
            current_roles = role_counts.get(slug, 0)
        scraped_at_str = latest_snap["scraped_at"]

        # Exclude the latest snapshot from the comparison pool so we don't
        # compare a company to itself when there's only one scrape run.
        comparison_snaps = comp_snaps[1:]
        previous_roles = current_roles  # default: no history yet

        if comparison_snaps and not country:
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

        # Ignore obvious scraper coverage corrections. They are not hiring
        # growth and would create misleading executive signals.
        if previous_roles > 0 and current_roles / previous_roles >= 4:
            previous_roles = current_roles

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
            "scraped_at": scraped_at_str,
            "top_hiring_location": (
                location_counts.get(slug, Counter()).most_common(1)[0][0]
                if location_counts.get(slug)
                else "N/A"
            ),
        })

    return set_cached_response(cache_key, 600, result)


@app.get("/company/{slug}")
def get_company(
    slug: str,
    days: int = Query(7, ge=1, le=365),
    country: str | None = None,
):
    cache_key = _cache_key("company", slug=slug, days=days, country=country)
    cached = get_cached_response(cache_key)
    if cached is not None:
        return cached

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

    # Filter to roles seen in the most recent scrape window only.
    # The roles table is append-only and accumulates all historic rows,
    # so without this filter category/location counts are inflated.
    roles = fetch_all_roles(
        "*",
        effective_role_cutoff(days, company_slug=slug, country=country),
        company_slug=slug,
        country=country,
    )

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

    return set_cached_response(cache_key, 600, {
        "slug": comp["slug"],
        "name": comp["name"],
        "snapshots": snaps_res.data,
        "categories": categories_list,
        "countries": countries_list,
        "roles": sorted_roles
    })


@app.get("/roles")
def get_roles(
    days: int = Query(7, ge=1, le=365),
    company_slug: str | None = None,
    category: str | None = None,
    country: str | None = None,
    limit: int = Query(50, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    cache_key = _cache_key(
        "roles",
        days=days,
        company_slug=company_slug,
        category=category,
        country=country,
        limit=limit,
        offset=offset,
    )
    cached = get_cached_response(cache_key)
    if cached is not None:
        return cached

    cutoff = effective_role_cutoff(days, company_slug=company_slug, country=country)
    roles = fetch_all_roles(
        "company_slug, category, country",
        cutoff,
        company_slug=company_slug,
        country=country,
    )
    if category:
        roles = [role for role in roles if (role.get("category") or "Uncategorized") == category]

    companies_res = supabase.table("companies").select("slug, name").execute()
    company_names = {company["slug"]: company["name"] for company in companies_res.data}

    page_query = (
        supabase.table("roles")
        .select("*")
        .gte("last_seen_at", cutoff)
        .order("last_seen_at", desc=True)
        .range(offset, offset + limit - 1)
    )
    if company_slug:
        page_query = page_query.eq("company_slug", company_slug)
    if country:
        page_query = page_query.eq("country", country)
    if category:
        page_query = page_query.eq("category", category)

    page_roles = page_query.execute().data
    total = len(roles)

    def summarize(key: str):
        counts = Counter(role.get(key) or "Unknown" for role in roles)
        return [
            {"label": label, "count": count}
            for label, count in counts.most_common()
        ]

    result = []
    for role in page_roles:
        slug = role.get("company_slug") or ""
        result.append({
            "id": role.get("id") or role.get("source_url"),
            "title": role.get("title") or "Untitled role",
            "company": company_names.get(slug, slug),
            "companySlug": slug,
            "category": role.get("category") or "Uncategorized",
            "location": role.get("location") or "",
            "country": role.get("country") or "Unknown",
            "seniority": role.get("seniority") or "N/A",
            "workMode": role.get("work_mode") or "N/A",
            "sourceUrl": role.get("source_url") or "",
            "lastSeenAt": role.get("last_seen_at") or "",
        })

    next_offset = offset + len(result)
    return set_cached_response(cache_key, 300, {
        "roles": result,
        "total": total,
        "limit": limit,
        "offset": offset,
        "hasMore": next_offset < total,
        "nextOffset": next_offset if next_offset < total else None,
        "facets": {
            "company": [
                {"label": company_names.get(label, label), "slug": label, "count": count}
                for label, count in Counter(role.get("company_slug") or "Unknown" for role in roles).most_common()
            ],
            "category": summarize("category"),
            "country": summarize("country"),
        },
    })


@app.get("/categories")
def get_categories(
    days: int = Query(7, ge=1, le=365),
    company_slug: str | None = None,
    country: str | None = None,
):
    cache_key = _cache_key("categories", days=days, company_slug=company_slug, country=country)
    cached = get_cached_response(cache_key)
    if cached is not None:
        return cached

    # Only count roles seen in the most recent scrape window to match snapshot counts.
    roles = fetch_all_roles(
        "category",
        effective_role_cutoff(days, company_slug=company_slug, country=country),
        company_slug,
        country,
    )

    categories = Counter()
    for r in roles:
        cat = r.get("category") or "Uncategorized"
        categories[cat] += 1

    result = [{"category": k, "count": v} for k, v in categories.items()]
    result.sort(key=lambda x: x["count"], reverse=True)

    return set_cached_response(cache_key, 600, result)


@app.get("/category-matrix")
def get_category_matrix(
    days: int = Query(7, ge=1, le=365),
    company_slug: str | None = None,
    country: str | None = None,
):
    cache_key = _cache_key("category_matrix", days=days, company_slug=company_slug, country=country)
    cached = get_cached_response(cache_key)
    if cached is not None:
        return cached

    """
    Returns role counts broken down by category × company.
    Used to render the heatmap on the dashboard.
    Only counts roles seen in the most recent scrape window so numbers
    match the snapshot-based company table.
    """
    roles_data = fetch_all_roles(
        "company_slug, category",
        effective_role_cutoff(days, company_slug=company_slug, country=country),
        company_slug,
        country,
    )
    companies_res = supabase.table("companies").select("slug, name").execute()

    company_names = {c["slug"]: c["name"] for c in companies_res.data}
    all_companies = [
        c["name"] for c in companies_res.data
        if not company_slug or c["slug"] == company_slug
    ]

    matrix: dict[str, dict[str, int]] = {}
    for r in roles_data:
        cat = r.get("category") or "Uncategorized"
        name = company_names.get(r.get("company_slug") or "", "Unknown")
        if cat not in matrix:
            matrix[cat] = {}
        matrix[cat][name] = matrix[cat].get(name, 0) + 1

    result = []
    for cat, company_counts in matrix.items():
        total = sum(company_counts.values())
        result.append({
            "category": cat,
            "total": total,
            "companies": {name: company_counts.get(name, 0) for name in all_companies},
        })

    result.sort(key=lambda x: x["total"], reverse=True)
    return set_cached_response(cache_key, 600, {"companies": all_companies, "matrix": result})


@app.get("/categories/seniority")
def get_category_seniority(
    days: int = Query(7, ge=1, le=365),
    company_slug: str | None = None,
    country: str | None = None,
):
    cache_key = _cache_key("category_seniority", days=days, company_slug=company_slug, country=country)
    cached = get_cached_response(cache_key)
    if cached is not None:
        return cached

    """
    Returns seniority breakdown (senior / mid / junior) per category.
    Used to render split bars on the dashboard.
    Only counts roles seen in the most recent scrape window.
    """
    roles_data = fetch_all_roles(
        "category, seniority",
        effective_role_cutoff(days, company_slug=company_slug, country=country),
        company_slug,
        country,
    )

    SENIOR = {"Senior", "Staff", "Lead", "Principal", "Director"}
    JUNIOR = {"Junior", "Associate", "Entry", "Intern"}

    breakdown: dict[str, dict[str, int]] = {}
    for r in roles_data:
        cat = r.get("category") or "Uncategorized"
        sen = r.get("seniority") or ""
        if cat not in breakdown:
            breakdown[cat] = {"senior": 0, "mid": 0, "junior": 0}
        if sen in SENIOR:
            breakdown[cat]["senior"] += 1
        elif sen in JUNIOR:
            breakdown[cat]["junior"] += 1
        else:
            breakdown[cat]["mid"] += 1

    result = []
    for cat, counts in breakdown.items():
        total = counts["senior"] + counts["mid"] + counts["junior"]
        result.append({
            "category": cat,
            "total": total,
            "senior": counts["senior"],
            "mid": counts["mid"],
            "junior": counts["junior"],
            "senior_pct": round((counts["senior"] / total) * 100) if total > 0 else 0,
        })

    result.sort(key=lambda x: x["total"], reverse=True)
    return set_cached_response(cache_key, 600, result)


@app.get("/unusual-signals")
def get_unusual_signals(
    days: int = Query(7, ge=1, le=365),
    company_slug: str | None = None,
    country: str | None = None,
):
    cache_key = _cache_key("unusual_signals", days=days, company_slug=company_slug, country=country)
    cached = get_cached_response(cache_key)
    if cached is not None:
        return cached

    """
    Detects unusual role patterns per company by scanning titles for
    keywords that are atypical for a software/AI company but carry
    strong strategic signal (e.g. tutors = RLHF trainers).
    Returns the top detected signal per company slug.
    """
    # Before adding or changing signal copy, follow SIGNAL_WRITING_PROMPT.md.
    PATTERNS: list[dict] = [
        # Science / RLHF trainers (xAI, Anthropic)
        {
            "keywords": ["tutor", "math", "biolog", "chemist", "physic", "earth sci", "geolog", "astro"],
            "label": "Training AI on science",
            "description": "Hiring scientists to teach the model, betting on scientific reasoning as a competitive edge",
        },
        # Data labeling / annotation
        {
            "keywords": [
                "annotator", "labeler", "data label", "rater", "content reviewer",
                "quality auditor", "data quality", "data services", "data associate", "training specialist",
            ],
            "label": "Building better training data",
            "description": "More human reviewers means a smarter model, investing in quality, not just speed",
            "by_company": {
                "amazonagi": {
                    "label": "Scaling AGI data operations",
                    "description": "Amazon AGI is hiring data quality, auditing, and training roles, signaling a large human feedback operation behind model improvement",
                },
            },
        },
        # Safety / red team
        {
            "keywords": ["red team", "redteam", "adversarial", "jailbreak", "safety evaluator"],
            "label": "Testing for weaknesses",
            "description": "Finding flaws before enterprise clients do, reducing liability and unlocking bigger deals",
        },
        # Trust, policy, ethics
        {
            "keywords": [
                "ethicist", "responsible ai", "trust & safety", "trust and safety",
                "content policy", "community policy",
            ],
            "label": "Avoiding regulatory trouble",
            "description": "Building guardrails needed to scale without getting fined or shut down",
        },
        # Government / regulatory affairs (OpenAI, Anthropic)
        {
            "keywords": [
                "policy", "government affairs", "regulatory affairs",
                "public affairs", "legislation", "government relation",
            ],
            "label": "Going after government contracts",
            "description": "Government AI contracts are among the largest deals available, and this is the sales team for that",
        },
        # Forward-deployed AI / sovereign enterprise rollouts (Mistral)
        {
            "keywords": [
                "deployment strategist", "forward deployed", "sovereign institution",
                "critical and sovereign", "ai4engineering", "applied ai",
            ],
            "label": "Building an AI deployment consultancy",
            "description": "Hiring deployment strategists and forward-deployed AI engineers signals a services layer around model implementation",
            "by_company": {
                "anthropic": {
                    "label": "Pushing Claude into enterprises",
                    "description": "Anthropic is hiring applied AI architects and industry account roles, signaling a stronger push to turn Claude into deployed enterprise workflows",
                },
                "openai": {
                    "label": "Embedding AI inside customers",
                    "description": "OpenAI is hiring forward-deployed and deployment engineers, signaling hands-on enterprise and government implementation, not just API access",
                },
                "perplexityai": {
                    "label": "Taking AI search into enterprise workflows",
                    "description": "Perplexity is hiring applied AI and enterprise experience roles, signaling a move from consumer search toward workplace deployment",
                },
                "mistral": {
                    "label": "Building an AI deployment consultancy",
                    "description": "Mistral is hiring deployment strategists and forward-deployed AI engineers, signaling a services layer around its models that competes with Accenture and PwC for enterprise AI implementation",
                },
            },
        },
        # Legal / compliance
        {
            "keywords": ["lawyer", "attorney", "legal counsel", "general counsel", "compliance", "legal advisor"],
            "label": "Legal expansion",
            "description": "Scaling legal capacity, a prerequisite for large enterprise deals and regulated markets",
        },
        # Infrastructure / data center ops (Nvidia, OpenAI Stargate, CoreWeave)
        {
            "keywords": [
                "data center", "datacenter", "ai infrastructure", "dgx cloud",
                "cluster", "facilities", "site reliability", "power",
                "mechanical engineer", "electrical engineer", "hvac",
            ],
            "label": "Competing in AI infrastructure",
            "description": "Data center, power, and AI infrastructure roles signal a move beyond chips into full-stack AI compute, competing with hyperscalers like Amazon and Google",
            "by_company": {
                "coreweave": {
                    "label": "Expanding AI cloud capacity",
                    "description": "CoreWeave is hiring data center, power, and infrastructure roles, signaling continued expansion of the physical cloud capacity AI labs depend on",
                },
            },
        },
        # Creative domain experts (OpenAI Sora, image gen models)
        {
            "keywords": [
                "filmmaker", "cinematograph", "video producer", "creative director",
                "concept artist", "animator", "storyboard", "photographer",
            ],
            "label": "Expanding into video and image AI",
            "description": "Hiring creatives to build visual AI means moving beyond text into a much bigger market",
        },
        # Medical / healthcare
        {
            "keywords": ["doctor", "physician", "nurse", "clinical", "radiolog", "patholog"],
            "label": "Entering healthcare",
            "description": "Hiring doctors and clinicians points toward healthcare AI, a market with strong pricing and high switching costs",
        },
        # Economics research
        {
            "keywords": ["economist", "economic research", "market design", "welfare"],
            "label": "Pricing and monetization strategy",
            "description": "Hiring economists to design how they charge signals serious work on revenue models",
        },
        # Alignment / safety research (distinct from red team)
        {
            "keywords": ["alignment", "interpretab", "mechanistic", "scalable oversight"],
            "label": "Betting on long-term AI safety",
            "description": "Deep research into keeping AI predictable and under control signals how seriously they take what comes next",
        },
        # Robotics / physical AI
        {
            "keywords": ["robotics", "mechatronics", "actuator", "embodied", "manipulation"],
            "label": "Moving AI into the physical world",
            "description": "Robots and hardware expand the company from software into physical products with high barriers to copy",
        },
        # Aviation / aerospace
        {
            "keywords": ["pilot", "aviation", "aerospace", "flight"],
            "label": "Defense and simulation",
            "description": "Aviation hires point to government defense contracts or building physical-world simulation data",
        },
    ]

    roles_data = fetch_all_roles(
        "company_slug, title",
        effective_role_cutoff(days, company_slug=company_slug, country=country),
        company_slug,
        country,
    )

    company_titles: dict[str, list[tuple[str, str]]] = {}
    for r in roles_data:
        slug = r.get("company_slug") or ""
        title = r.get("title") or ""
        company_titles.setdefault(slug, []).append((title, title.lower()))

    result: dict[str, dict] = {}
    for slug, titles in company_titles.items():
        best: dict | None = None
        for pattern in PATTERNS:
            keywords = pattern["keywords"]
            matched = [
                original
                for original, lowered in titles
                if any(keyword in lowered for keyword in keywords)
            ]
            if len(matched) >= 2:
                if best is None or len(matched) > best["count"]:
                    company_override = pattern.get("by_company", {}).get(slug, {})
                    label = company_override.get("label", pattern["label"])
                    description = company_override.get("description", pattern["description"])
                    evidence = sorted(
                        set(matched),
                        key=lambda title: (
                            -sum(keyword in title.lower() for keyword in keywords if keyword != "tutor"),
                            -sum(keyword in title.lower() for keyword in keywords),
                            len(title),
                            title,
                        ),
                    )[:3]
                    best = {
                        "label": label,
                        "count": len(matched),
                        "description": description,
                        "evidence": evidence,
                    }
        if best:
            result[slug] = best

    return set_cached_response(cache_key, 600, result)
