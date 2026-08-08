from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from db import supabase
from signals import build_company_signals


PAGE_SIZE = 1000


def parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def scrape_window_cutoff(scraped_at: str) -> str:
    parsed = parse_timestamp(scraped_at)
    if parsed is None:
        parsed = datetime.now(timezone.utc)
    return (parsed - timedelta(hours=24)).isoformat()


def fetch_roles_since(cutoff: str, columns: str = "*") -> list[dict]:
    rows: list[dict] = []
    offset = 0
    while True:
        batch = (
            supabase.table("roles")
            .select(columns)
            .gte("last_seen_at", cutoff)
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
            .data
            or []
        )
        rows.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def latest_scrape_at() -> str | None:
    latest = (
        supabase.table("role_snapshots")
        .select("scraped_at")
        .order("scraped_at", desc=True)
        .limit(1)
        .execute()
        .data
        or []
    )
    return latest[0]["scraped_at"] if latest else None


def load_companies() -> list[dict]:
    return supabase.table("companies").select("slug,name").execute().data or []


def load_snapshots(limit: int = 500) -> list[dict]:
    return (
        supabase.table("role_snapshots")
        .select("company_slug,scraped_at,total_open_roles")
        .order("scraped_at", desc=True)
        .limit(limit)
        .execute()
        .data
        or []
    )


def build_company_summary_rows(scraped_at: str, companies: list[dict], roles: list[dict], snapshots: list[dict]) -> list[dict]:
    by_company: dict[str, list[dict]] = defaultdict(list)
    for snapshot in snapshots:
        by_company[snapshot["company_slug"]].append(snapshot)

    role_counts = Counter(role.get("company_slug") for role in roles)
    top_locations: dict[str, str] = {}
    location_counts: dict[str, Counter] = defaultdict(Counter)
    for role in roles:
        slug = role.get("company_slug") or ""
        location_counts[slug][role.get("country") or "Unknown"] += 1
    for slug, counts in location_counts.items():
        top_locations[slug] = counts.most_common(1)[0][0]

    rows: list[dict] = []
    for company in companies:
        slug = company["slug"]
        snaps = by_company.get(slug, [])
        latest = snaps[0] if snaps else None
        previous = snaps[1] if len(snaps) > 1 else latest
        current_roles = latest["total_open_roles"] if latest else role_counts.get(slug, 0)
        previous_roles = previous["total_open_roles"] if previous else current_roles
        change = current_roles - previous_roles
        change_pct = round((change / previous_roles) * 100, 1) if previous_roles else 0.0
        rows.append({
            "scraped_at": scraped_at,
            "slug": slug,
            "name": company["name"],
            "current_roles": current_roles,
            "previous_roles": previous_roles,
            "change": change,
            "change_pct": change_pct,
            "top_hiring_location": top_locations.get(slug, "N/A"),
        })
    return rows


def build_category_matrix_rows(scraped_at: str, companies: list[dict], roles: list[dict]) -> list[dict]:
    matrix: dict[tuple[str, str, str], int] = defaultdict(int)
    company_names = {company["slug"]: company["name"] for company in companies}
    for role in roles:
        slug = role.get("company_slug") or ""
        matrix[(slug, company_names.get(slug, slug), role.get("category") or "Uncategorized")] += 1

    return [
        {
            "scraped_at": scraped_at,
            "company_slug": company_slug,
            "company_name": company_name,
            "category": category,
            "count": count,
        }
        for (company_slug, company_name, category), count in matrix.items()
    ]


def build_location_summary_rows(scraped_at: str, companies: list[dict], roles: list[dict]) -> list[dict]:
    company_names = {company["slug"]: company["name"] for company in companies}
    country_totals: Counter = Counter()
    top_company_by_country: dict[str, tuple[str, int]] = {}
    company_country_counts: dict[tuple[str, str], int] = defaultdict(int)

    for role in roles:
        country = role.get("country") or "Unknown"
        slug = role.get("company_slug") or ""
        country_totals[country] += 1
        company_country_counts[(country, slug)] += 1

    for (country, slug), count in company_country_counts.items():
        current = top_company_by_country.get(country)
        if current is None or count > current[1]:
            top_company_by_country[country] = (company_names.get(slug, slug), count)

    return [
        {
            "scraped_at": scraped_at,
            "country": country,
            "roles": count,
            "top_company": top_company_by_country.get(country, ("N/A", 0))[0],
        }
        for country, count in country_totals.items()
    ]


def build_company_signal_rows(scraped_at: str, companies: list[dict], roles: list[dict], category_rows: list[dict]) -> list[dict]:
    top_category_by_company: dict[str, tuple[str, int]] = {}
    for row in category_rows:
        current = top_category_by_company.get(row["company_slug"])
        if current is None or row["count"] > current[1]:
            top_category_by_company[row["company_slug"]] = (row["category"], row["count"])

    signals = build_company_signals(roles)
    rows: list[dict] = []
    for company in companies:
        slug = company["slug"]
        signal = signals.get(slug)
        rows.append({
            "scraped_at": scraped_at,
            "slug": slug,
            "name": company["name"],
            "label": signal["label"] if signal else None,
            "count": signal["count"] if signal else 0,
            "description": signal["description"] if signal else None,
            "evidence": signal["evidence"] if signal else [],
            "top_category": top_category_by_company.get(slug, ("Software Engineering", 0))[0],
        })
    return rows


def rebuild_read_models(scraped_at: str | None = None) -> dict[str, int | str]:
    effective_scraped_at = scraped_at or latest_scrape_at()
    if not effective_scraped_at:
        raise RuntimeError("No scrape snapshot found. Run the scraper first.")

    cutoff = scrape_window_cutoff(effective_scraped_at)
    companies = load_companies()
    roles = fetch_roles_since(cutoff)
    snapshots = load_snapshots()

    company_rows = build_company_summary_rows(effective_scraped_at, companies, roles, snapshots)
    category_rows = build_category_matrix_rows(effective_scraped_at, companies, roles)
    location_rows = build_location_summary_rows(effective_scraped_at, companies, roles)
    signal_rows = build_company_signal_rows(effective_scraped_at, companies, roles, category_rows)

    for table in [
        "company_summaries",
        "category_matrix_snapshots",
        "location_summaries",
        "company_signals",
    ]:
        supabase.table(table).delete().eq("scraped_at", effective_scraped_at).execute()

    if company_rows:
        supabase.table("company_summaries").insert(company_rows).execute()
    if category_rows:
        supabase.table("category_matrix_snapshots").insert(category_rows).execute()
    if location_rows:
        supabase.table("location_summaries").insert(location_rows).execute()
    if signal_rows:
        supabase.table("company_signals").insert(signal_rows).execute()

    return {
        "scraped_at": effective_scraped_at,
        "companies": len(company_rows),
        "categories": len(category_rows),
        "locations": len(location_rows),
        "signals": len(signal_rows),
    }
