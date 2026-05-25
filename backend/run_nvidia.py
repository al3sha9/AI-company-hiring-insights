from main import SCRAPERS, _scrape_one
from datetime import datetime, timezone

scraped_at = datetime.now(timezone.utc).isoformat()
for slug, mod in SCRAPERS:
    if slug == "nvidia":
        _scrape_one(slug, mod, scraped_at)
        break
