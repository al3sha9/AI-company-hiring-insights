"""
One-off script: reclassify all roles in Supabase using the updated CATEGORY_KEYWORDS.
Groups roles by newly-inferred category and does one bulk UPDATE per category group
instead of one request per row — orders of magnitude faster.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from db import supabase
from scraper.greenhouse import infer_category
from collections import defaultdict

PAGE_SIZE = 1000
offset = 0
# category -> list of (company_slug, source_url) to update
updates: dict[str, list[tuple[str, str]]] = defaultdict(list)

print("Fetching all roles...")
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
        new_cat = infer_category("", title)
        updates[new_cat].append((role["company_slug"], role["source_url"]))
    print(f"  Fetched {offset + len(batch)} roles so far...")
    if len(batch) < PAGE_SIZE:
        break
    offset += PAGE_SIZE

total_roles = sum(len(v) for v in updates.values())
print(f"\nTotal roles to update: {total_roles}")
print("Category breakdown:")
for cat, rows in sorted(updates.items(), key=lambda x: -len(x[1])):
    print(f"  {cat}: {len(rows)}")

print("\nApplying updates (one batch per category)...")
for cat, rows in updates.items():
    # Supabase doesn't support bulk UPDATE with IN on composite keys,
    # so we batch by company_slug to keep requests manageable.
    by_company: dict[str, list[str]] = defaultdict(list)
    for company_slug, source_url in rows:
        by_company[company_slug].append(source_url)

    for company_slug, urls in by_company.items():
        # Chunk in_ batches to avoid URL length limit in PostgREST
        CHUNK = 100
        for i in range(0, len(urls), CHUNK):
            supabase.table("roles").update({"category": cat}).eq(
                "company_slug", company_slug
            ).in_("source_url", urls[i:i + CHUNK]).execute()
    print(f"  ✓ {cat}: {len(rows)} roles")

print(f"\nDone. {total_roles} roles reclassified.")
