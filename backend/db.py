import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

if not url or not key:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_KEY must be set. "
        "Copy .env.example to .env and fill in your credentials."
    )

supabase: Client = create_client(url, key)
