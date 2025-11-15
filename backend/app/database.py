"""Database utilities for the Pet AI Model API."""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from .config import Settings

engine: AsyncEngine | None = None
SessionLocal: async_sessionmaker[AsyncSession] | None = None


async def init_engine(settings: Settings) -> None:
    """Initialise the asynchronous SQLAlchemy engine and session factory."""
    global engine, SessionLocal

    if engine is None:
        engine = create_async_engine(
            settings.database_url,
            echo=settings.debug_sql,
            future=True,
        )
        SessionLocal = async_sessionmaker(
            bind=engine,
            expire_on_commit=False,
            class_=AsyncSession,
        )


async def dispose_engine() -> None:
    """Dispose the engine and drop references."""
    global engine, SessionLocal

    if engine is not None:
        await engine.dispose()
        engine = None
        SessionLocal = None


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield an AsyncSession bound to the application engine."""
    if SessionLocal is None:
        raise RuntimeError("Database engine has not been initialised.")

    async with SessionLocal() as session:
        yield session


def get_engine() -> AsyncEngine:
    """Return the current engine instance."""
    if engine is None:
        raise RuntimeError("Database engine has not been initialised.")
    return engine

