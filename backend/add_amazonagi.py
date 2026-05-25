import os
from supabase import create_client
from dotenv import load_dotenv
load_dotenv()
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
try:
    supabase.table("companies").insert({"slug": "amazonagi", "name": "Amazon AGI"}).execute()
    print("Inserted Amazon AGI")
except Exception as e:
    print("Already exists or error:", e)
