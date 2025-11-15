from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from .config import get_settings
from .database import dispose_engine, get_engine, init_engine
from .models import Base
from .routers import auth, chats, profile


def create_app() -> FastAPI:
    """Application factory used for tests and runtime."""
    settings = get_settings()
    application = FastAPI(title=settings.app_name)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.on_event("startup")
    async def _startup() -> None:
        await init_engine(settings)
        engine = get_engine()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    @application.on_event("shutdown")
    async def _shutdown() -> None:
        await dispose_engine()

    @application.get("/health")
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    application.include_router(auth.router, prefix="/auth", tags=["auth"])
    application.include_router(profile.router, prefix="/profile", tags=["profile"])
    application.include_router(chats.router, prefix="/chats", tags=["chats"])

    @application.get("/", include_in_schema=False)
    async def swagger_redirect() -> RedirectResponse:
        return RedirectResponse(url="/docs")

    return application


app = create_app()

