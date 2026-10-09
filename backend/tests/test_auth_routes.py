"""Tests for authentication routes."""

from collections.abc import Generator
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base, get_db
from app.core.security import Argon2PasswordHasher
from app.domain.primitives import EmploymentType, RoleName
from app.main import app
from app.models.employee import FullTimeEmployee
from app.models.role import Role


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Create a database session for testing."""
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture
def client(db_session: Session) -> TestClient:
    """Create a test client with database override."""

    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def employee(db_session: Session) -> FullTimeEmployee:
    """Create a test employee."""
    hasher = Argon2PasswordHasher()
    role = Role(name=RoleName.EMPLOYEE, description="Employee")
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)

    employee = FullTimeEmployee(
        employee_code="EMP001",
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        password_hash=hasher.hash("password123"),
        department="Engineering",
        job_title="Engineer",
        hire_date=datetime.now(UTC),
        role_id=role.id,
        employment_type=EmploymentType.FULL_TIME,
        is_active=True,
    )
    db_session.add(employee)
    db_session.commit()
    db_session.refresh(employee)
    return employee


def test_login_success(client: TestClient, employee: FullTimeEmployee) -> None:
    """Test successful login returns tokens."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "john@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_refresh_token_success(
    client: TestClient, employee: FullTimeEmployee
) -> None:
    """Test refresh token returns new access token."""
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "john@example.com", "password": "password123"},
    )
    refresh_token = login_response.json()["refresh_token"]

    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_response.status_code == 200
    data = refresh_response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_refresh_token_invalid(client: TestClient) -> None:
    """Test refresh with invalid token returns 401."""
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid-token"},
    )
    assert response.status_code == 401


def test_get_current_user_authenticated(
    client: TestClient,
    employee: FullTimeEmployee,
) -> None:
    """Test /auth/me returns user info when authenticated."""
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "john@example.com", "password": "password123"},
    )
    access_token = login_response.json()["access_token"]

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_response.status_code == 200
    data = me_response.json()
    assert data["email"] == "john@example.com"
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert data["role"] == "EMPLOYEE"
    assert isinstance(data["permissions"], list)


def test_get_current_user_unauthenticated(client: TestClient) -> None:
    """Test /auth/me returns 401 when not authenticated."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
