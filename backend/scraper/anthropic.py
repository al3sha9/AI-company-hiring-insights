from scraper.greenhouse import scrape_greenhouse

COMPANY_SLUG = "anthropic"
BOARD_TOKEN = "anthropic"


def scrape():
    return scrape_greenhouse(board_token=BOARD_TOKEN, company_slug=COMPANY_SLUG)
