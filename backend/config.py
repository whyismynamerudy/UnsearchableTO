from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    COHERE_API_KEY: str
    DB_CONNECTION_STRING: str
    # Add other configuration variables here, e.g.:
    # DATABASE_URL: str
    # SECRET_KEY: str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
