import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from main import reset_roles


if __name__ == "__main__":
    result = reset_roles()
    print(result)
