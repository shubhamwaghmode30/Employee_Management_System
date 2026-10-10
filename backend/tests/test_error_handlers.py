"""Tests that every error leaves the API in the shared ErrorResponse shape."""

from collections.abc import Generator

import pytest
from fastapi import APIRouter, FastAPI
from fastapi.testclient import TestClient

from app.api.error_handlers import register_error_handlers
from app.domain.primitives import (
    AuthorizationError,
    DuplicateEmailError,
    DuplicateEmployeeCodeError,
    EntityNotFoundError,
    InvalidEmployeeDataError,
    Permission,
    SelfActionError,
)


def raise_domain_error(error_name: str) -> None:
    """Raise one domain error by name so each case shares a single route."""
    errors: dict[str, Exception] = {
        "forbidden": AuthorizationError(Permission.EMPLOYEE_DELETE),
        "self": SelfActionError("delete"),
        "missing": EntityNotFoundError("Employee", "ENG404"),
        "email": DuplicateEmailError("priya.sharma@company.com"),
        "code": DuplicateEmployeeCodeError("HRM001"),
        "invalid": InvalidEmployeeDataError("Role 9 does not exist"),
        "crash": RuntimeError("database password is hunter2"),
    }
    raise errors[error_name]


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Build a bare app with the handlers and one failing route."""
    application = FastAPI()
    register_error_handlers(application)
    router = APIRouter()

    @router.get("/fail/{error_name}")
    def fail(error_name: str) -> None:
        raise_domain_error(error_name)

    @router.get("/paged")
    def paged(page_size: int) -> int:
        return page_size

    application.include_router(router)
    with TestClient(application, raise_server_exceptions=False) as test_client:
        yield test_client


@pytest.mark.parametrize(
    ("error_name", "status_code", "code"),
    [
        ("forbidden", 403, "FORBIDDEN"),
        ("self", 403, "SELF_ACTION_FORBIDDEN"),
        ("missing", 404, "NOT_FOUND"),
        ("email", 409, "DUPLICATE_EMAIL"),
        ("code", 409, "DUPLICATE_EMPLOYEE_CODE"),
        ("invalid", 422, "INVALID_EMPLOYEE_DATA"),
    ],
)
def test_domain_errors_map_to_status_and_code(
    client: TestClient, error_name: str, status_code: int, code: str
) -> None:
    response = client.get(f"/fail/{error_name}")

    assert response.status_code == status_code
    assert set(response.json()) == {"code", "message"}
    assert response.json()["code"] == code


def test_validation_error_is_flattened(client: TestClient) -> None:
    response = client.get("/paged", params={"page_size": "ten"})

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"
    assert response.json()["message"].startswith("query.page_size:")


def test_unknown_route_keeps_error_shape(client: TestClient) -> None:
    response = client.get("/payroll")

    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def test_unexpected_error_hides_details(client: TestClient) -> None:
    response = client.get("/fail/crash")

    assert response.status_code == 500
    assert response.json() == {
        "code": "INTERNAL_ERROR",
        "message": "An unexpected error occurred",
    }
