from functools import lru_cache
import os
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = Field(default="Pet AI Model API", description="Display name")
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/pet_ai_model",
        description="Database connection string",
    )
    secret_key: str = Field(default="dev-secret-change-me", description="JWT secret")
    access_token_expire_minutes: int = Field(default=60)
    backend_cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )
    open_router_api_key: str | None = Field(
        default=None,
        alias="OPEN_ROUTER_API_KEY",
        description="OpenRouter API key",
    )
    openrouter_model: str = Field(default="z-ai/glm-4.5-air")
    openrouter_temperature: float = Field(default=0.7)
    openrouter_max_history: int = Field(default=15)
    debug_sql: bool = Field(default=False)
    system_prompt: str = Field(
        default=(
            "You are an AI assistant helping users with their pet-related questions. "
            "Provide concise, friendly, and informative answers."
        )
    )

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def _split_str(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("open_router_api_key", mode="before")
    @classmethod
    def _fallback_openrouter(cls, value: Any) -> str | None:
        if value:
            return value
        return os.getenv("OPENROUTER_API_KEY")


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()

