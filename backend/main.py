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
import scraper.nvidia as nvidia_scraper
import scraper.amazon as amazonagi_scraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def fetch_all_roles(columns: str, recent_cutoff: str, company_slug: str = None) -> list[dict]:
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
    ("nvidia", nvidia_scraper),
    ("amazonagi", amazonagi_scraper),
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

    # Run scrapers sequentially to avoid macOS [Errno 35] socket saturation
    # that occurs when 6+ outbound connections fire simultaneously.
    for slug, module in SCRAPERS:
        summary.append(_scrape_one(slug, module, scraped_at))

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

    # Filter to roles seen in the most recent scrape window only.
    # The roles table is append-only and accumulates all historic rows,
    # so without this filter category/location counts are inflated.
    recent_cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    roles = fetch_all_roles("*", recent_cutoff, company_slug=slug)

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
    # Only count roles seen in the most recent scrape window to match snapshot counts.
    recent_cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    roles = fetch_all_roles("category", recent_cutoff)

    categories = Counter()
    for r in roles:
        cat = r.get("category") or "Uncategorized"
        categories[cat] += 1

    result = [{"category": k, "count": v} for k, v in categories.items()]
    result.sort(key=lambda x: x["count"], reverse=True)

    return result


@app.get("/category-matrix")
def get_category_matrix():
    """
    Returns role counts broken down by category × company.
    Used to render the heatmap on the dashboard.
    Only counts roles seen in the most recent scrape window so numbers
    match the snapshot-based company table.
    """
    recent_cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    roles_data = fetch_all_roles("company_slug, category", recent_cutoff)
    companies_res = supabase.table("companies").select("slug, name").execute()

    company_names = {c["slug"]: c["name"] for c in companies_res.data}
    all_companies = [c["name"] for c in companies_res.data]

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
    return {"companies": all_companies, "matrix": result}


@app.get("/categories/seniority")
def get_category_seniority():
    """
    Returns seniority breakdown (senior / mid / junior) per category.
    Used to render split bars on the dashboard.
    Only counts roles seen in the most recent scrape window.
    """
    recent_cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    roles_data = fetch_all_roles("category, seniority", recent_cutoff)

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
    return result


@app.get("/unusual-signals")
def get_unusual_signals():
    """
    Detects unusual role patterns per company by scanning titles for
    keywords that are atypical for a software/AI company but carry
    strong strategic signal (e.g. tutors = RLHF trainers).
    Returns the top detected signal per company slug.
    """
    PATTERNS: list[tuple[list[str], str, str]] = [
        # Science / RLHF trainers (xAI, Anthropic)
        (["tutor", "biolog", "chemist", "physic", "earth sci", "geolog", "astro"],
         "Training AI on science", "Hiring scientists to teach the model — betting on scientific reasoning as a competitive edge"),
        # Data labeling / annotation
        (["annotator", "labeler", "data label", "rater", "content reviewer"],
         "Building better training data", "More human reviewers means a smarter model — investing in quality, not just speed"),
        # Safety / red team
        (["red team", "redteam", "adversarial", "jailbreak", "safety evaluator"],
         "Testing for weaknesses", "Finding flaws before enterprise clients do — reduces liability and unlocks bigger deals"),
        # Trust, policy, ethics
        (["ethicist", "responsible ai", "trust & safety", "trust and safety",
          "content policy", "community policy"],
         "Avoiding regulatory trouble", "Building guardrails needed to scale without getting fined or shut down"),
        # Government / regulatory affairs (OpenAI, Anthropic)
        (["policy", "government affairs", "regulatory affairs",
          "public affairs", "legislation", "government relation"],
         "Going after government contracts", "Government AI contracts are among the largest deals available — this is the sales team for that"),
        # Legal / compliance
        (["lawyer", "attorney", "legal counsel", "general counsel",
          "compliance", "legal advisor"],
         "Legal expansion", "Scaling legal capacity — a prerequisite for large enterprise deals and regulated markets"),
        # Infrastructure / data center ops (OpenAI Stargate, CoreWeave)
        (["data center", "facilities", "site reliability", "power",
          "mechanical engineer", "electrical engineer", "hvac"],
         "Building their own data centers", "Owning physical hardware instead of renting it — cuts long-term costs and reduces dependency on cloud providers"),
        # Creative domain experts (OpenAI Sora, image gen models)
        (["filmmaker", "cinematograph", "video producer", "creative director",
          "concept artist", "animator", "storyboard", "photographer"],
         "Expanding into video and image AI", "Hiring creatives to build visual AI — moving beyond text into a much bigger market"),
        # Medical / healthcare
        (["doctor", "physician", "nurse", "clinical", "radiolog", "patholog"],
         "Entering healthcare", "Hiring doctors and clinicians — healthcare AI commands strong pricing and high switching costs"),
        # Economics research
        (["economist", "economic research", "market design", "welfare"],
         "Pricing and monetization strategy", "Hiring economists to design how they charge — a sign they're thinking seriously about revenue models"),
        # Alignment / safety research (distinct from red team)
        (["alignment", "interpretab", "mechanistic", "scalable oversight"],
         "Betting on long-term AI safety", "Deep research into keeping AI predictable and under control — signals how seriously they take what comes next"),
        # Robotics / physical AI
        (["robotics", "mechatronics", "actuator", "embodied", "manipulation"],
         "Moving AI into the physical world", "Robots and hardware — expanding from software into physical products with high barriers to copy"),
        # Aviation / aerospace
        (["pilot", "aviation", "aerospace", "flight"],
         "Defense and simulation", "Aviation hires point to government defense contracts or building physical-world simulation data"),
    ]


    recent_cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    roles_data = fetch_all_roles("company_slug, title", recent_cutoff)

    company_titles: dict[str, list[str]] = {}
    for r in roles_data:
        slug = r.get("company_slug") or ""
        title = (r.get("title") or "").lower()
        company_titles.setdefault(slug, []).append(title)

    result: dict[str, dict] = {}
    for slug, titles in company_titles.items():
        best: dict | None = None
        for keywords, label, description in PATTERNS:
            matched = [t for t in titles if any(kw in t for kw in keywords)]
            if len(matched) >= 2:
                if best is None or len(matched) > best["count"]:
                    best = {"label": label, "count": len(matched), "description": description}
        if best:
            result[slug] = best

    return result


