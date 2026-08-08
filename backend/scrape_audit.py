import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from main import scrape_audit


if __name__ == "__main__":
    result = scrape_audit()
    print(result)
