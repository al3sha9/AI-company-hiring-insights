import scraper.nvidia as n
import logging
logging.basicConfig(level=logging.INFO)
print("Scraped:", len(n.scrape()))
