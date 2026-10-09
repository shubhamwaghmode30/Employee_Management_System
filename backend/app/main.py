from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import auth_router
from app.api.health import health_router
from app.core.settings import get_settings


def create_app() -> FastAPI:
    """Build the ASGI application.

    Settings are loaded so boot fails fast on invalid env.
    """

    settings = get_settings()
    application = FastAPI(
        title="Employee Management System",
        version="0.1.0",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(health_router, prefix="/api/v1")
    application.include_router(auth_router, prefix="/api/v1")
    return application


app = create_app()
