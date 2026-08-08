import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from main import run_scrape_pipeline


if __name__ == "__main__":
    result = run_scrape_pipeline()
    print(result)
