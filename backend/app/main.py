from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.auth import auth_router
from app.api.employee import employee_router
from app.api.health import health_router
from app.core.settings import get_settings
from app.domain.primitives import (
    AuthenticationError,
    AuthorizationError,
    DuplicateEmailError,
    EntityNotFoundError,
)
from app.schemas.error import ErrorResponse


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

    @application.exception_handler(AuthenticationError)
    async def authentication_error_handler(
        request: Request, exc: AuthenticationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=ErrorResponse(code="UNAUTHORIZED", message=str(exc)).model_dump(),
        )

    @application.exception_handler(AuthorizationError)
    async def authorization_error_handler(
        request: Request, exc: AuthorizationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content=ErrorResponse(code="FORBIDDEN", message=str(exc)).model_dump(),
        )

    @application.exception_handler(EntityNotFoundError)
    async def not_found_error_handler(
        request: Request, exc: EntityNotFoundError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=ErrorResponse(code="NOT_FOUND", message=str(exc)).model_dump(),
        )

    @application.exception_handler(DuplicateEmailError)
    async def duplicate_email_error_handler(
        request: Request, exc: DuplicateEmailError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=ErrorResponse(
                code="DUPLICATE_EMAIL", message=str(exc)
            ).model_dump(),
        )

    @application.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request, exc: HTTPException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(code="HTTP_ERROR", message=exc.detail).model_dump(),
        )

    application.include_router(health_router, prefix="/api/v1")
    application.include_router(auth_router, prefix="/api/v1")
    application.include_router(employee_router, prefix="/api/v1")
    return application


app = create_app()
