import os
from supabase import create_client
from dotenv import load_dotenv
load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
logs = supabase.table("scrape_logs").select("*").eq("company_slug", "nvidia").order("scraped_at", desc=True).limit(5).execute()
print("Recent logs:", logs.data)
roles = supabase.table("roles").select("id", count="exact").eq("company_slug", "nvidia").execute()
print("Total roles:", roles.count)
