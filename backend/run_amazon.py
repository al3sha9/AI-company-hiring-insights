from main import SCRAPERS, _scrape_one
import asyncio
from datetime import datetime, timezone

scraped_at = datetime.now(timezone.utc).isoformat()
for slug, mod in SCRAPERS:
    if slug == "amazonagi":
        _scrape_one(slug, mod, scraped_at)
        break
