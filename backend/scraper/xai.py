from scraper.greenhouse import scrape_greenhouse

COMPANY_SLUG = "xai"
BOARD_TOKEN = "xai"


def scrape():
    return scrape_greenhouse(board_token=BOARD_TOKEN, company_slug=COMPANY_SLUG)
