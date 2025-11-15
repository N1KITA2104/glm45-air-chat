"""Database utilities for the Pet AI Model API."""

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

# Placeholders to be configured in subsequent iterations.
engine: AsyncEngine | None = None
SessionLocal: async_sessionmaker[AsyncSession] | None = None

