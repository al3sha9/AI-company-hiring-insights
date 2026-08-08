import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from read_models import rebuild_read_models


if __name__ == "__main__":
    result = rebuild_read_models()
    print(result)
