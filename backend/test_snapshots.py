import os
from supabase import create_client
from dotenv import load_dotenv
load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
snaps = supabase.table("role_snapshots").select("*").eq("company_slug", "nvidia").order("scraped_at", desc=True).limit(5).execute()
print("Snapshots:", snaps.data)
