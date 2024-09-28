from supabase import create_client, Client
from config import settings

# Create a Supabase client
def get_supabase_client() -> Client:
    url = settings.SUPABASE_URL  # Your Supabase URL
    key = settings.SUPABASE_KEY    # Your Supabase API key
    return create_client(url, key)

# Optionally, you can create a global client instance
supabase_client = get_supabase_client()