from scraper.greenhouse import scrape_greenhouse

COMPANY_SLUG = "openai"
BOARD_TOKEN = "openai"


def scrape():
    return scrape_greenhouse(board_token=BOARD_TOKEN, company_slug=COMPANY_SLUG)
