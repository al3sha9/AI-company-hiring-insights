import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

res = supabase.table("companies").upsert({"slug": "nvidia", "name": "Nvidia"}).execute()
print("Added Nvidia:", res.data)
