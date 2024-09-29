from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    COHERE_API_KEY: str
    GEMINI_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    DB_CONNECTION_STRING: str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
