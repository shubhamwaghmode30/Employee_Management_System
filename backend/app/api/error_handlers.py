"""Map domain exceptions and framework errors to ErrorResponse payloads."""

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.domain.primitives import (
    AuthenticationError,
    AuthorizationError,
    DuplicateEmailError,
    DuplicateEmployeeCodeError,
    EntityNotFoundError,
    InvalidEmployeeDataError,
    InvalidTokenError,
    SelfActionError,
)
from app.schemas.error import ErrorResponse

logger = logging.getLogger(__name__)

DOMAIN_ERRORS: dict[type[Exception], tuple[int, str]] = {
    AuthenticationError: (status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED"),
    InvalidTokenError: (status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED"),
    AuthorizationError: (status.HTTP_403_FORBIDDEN, "FORBIDDEN"),
    SelfActionError: (status.HTTP_403_FORBIDDEN, "SELF_ACTION_FORBIDDEN"),
    EntityNotFoundError: (status.HTTP_404_NOT_FOUND, "NOT_FOUND"),
    DuplicateEmailError: (status.HTTP_409_CONFLICT, "DUPLICATE_EMAIL"),
    DuplicateEmployeeCodeError: (status.HTTP_409_CONFLICT, "DUPLICATE_EMPLOYEE_CODE"),
    InvalidEmployeeDataError: (
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        "INVALID_EMPLOYEE_DATA",
    ),
}

HTTP_STATUS_CODES: dict[int, str] = {
    status.HTTP_400_BAD_REQUEST: "BAD_REQUEST",
    status.HTTP_401_UNAUTHORIZED: "UNAUTHORIZED",
    status.HTTP_403_FORBIDDEN: "FORBIDDEN",
    status.HTTP_404_NOT_FOUND: "NOT_FOUND",
    status.HTTP_405_METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
    status.HTTP_409_CONFLICT: "CONFLICT",
}


def error_json(status_code: int, code: str, message: str) -> JSONResponse:
    """Build a JSON response in the shared ErrorResponse shape."""
    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(code=code, message=message).model_dump(),
    )


async def handle_domain_error(request: Request, exc: Exception) -> JSONResponse:
    """Translate a registered domain exception using DOMAIN_ERRORS."""
    status_code, code = DOMAIN_ERRORS[type(exc)]
    return error_json(status_code, code, str(exc))


async def handle_validation_error(request: Request, exc: Exception) -> JSONResponse:
    """Collapse pydantic's error list into one readable message."""
    if not isinstance(exc, RequestValidationError):
        return await handle_unexpected_error(request, exc)
    messages: list[str] = []
    for error in exc.errors():
        location = ".".join(str(part) for part in error["loc"] if part != "body")
        message = str(error["msg"]).removeprefix("Value error, ")
        messages.append(f"{location}: {message}" if location else message)
    return error_json(
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        "VALIDATION_ERROR",
        "; ".join(messages) or "Invalid request",
    )


async def handle_http_error(request: Request, exc: Exception) -> JSONResponse:
    """Keep framework errors (missing token, unknown route) in the same shape."""
    if not isinstance(exc, StarletteHTTPException):
        return await handle_unexpected_error(request, exc)
    code = HTTP_STATUS_CODES.get(exc.status_code, "HTTP_ERROR")
    return error_json(exc.status_code, code, str(exc.detail))


async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    """Log the traceback server-side and never leak it to the client."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return error_json(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "INTERNAL_ERROR",
        "An unexpected error occurred",
    )


def register_error_handlers(application: FastAPI) -> None:
    """Attach every error handler to the application."""
    for exception_type in DOMAIN_ERRORS:
        application.add_exception_handler(exception_type, handle_domain_error)
    application.add_exception_handler(RequestValidationError, handle_validation_error)
    application.add_exception_handler(StarletteHTTPException, handle_http_error)
    application.add_exception_handler(Exception, handle_unexpected_error)
