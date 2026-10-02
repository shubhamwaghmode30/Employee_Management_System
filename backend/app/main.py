from fastapi import FastAPI

from app.api.health import health_router
from app.core.settings import get_settings


def create_app() -> FastAPI:
    """Build the ASGI application.

    Settings are loaded so boot fails fast on invalid env.
    """

    get_settings()
    application = FastAPI(
        title="Employee Management System",
        version="0.1.0",
    )
    application.include_router(health_router, prefix="/api/v1")
    return application


app = create_app()
