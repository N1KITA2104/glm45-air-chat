from fastapi import FastAPI


def create_app() -> FastAPI:
    """Application factory used for tests and runtime."""
    application = FastAPI(title="Pet AI Model API")

    @application.get("/health")
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()

