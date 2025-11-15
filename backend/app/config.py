from functools import lru_cache

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    app_name: str = Field(default="Pet AI Model API", description="Display name")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()

