"""Tests for employee routes."""

from collections.abc import Generator
from datetime import UTC, datetime
from decimal import Decimal

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
def admin_token(db_session: Session) -> str:
    """Create an admin user and return auth token."""
    hasher = Argon2PasswordHasher()
    role = Role(name=RoleName.ADMIN, description="Admin")
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)

    admin = FullTimeEmployee(
        employee_code="ADMIN001",
        first_name="Admin",
        last_name="User",
        email="admin@example.com",
        password_hash=hasher.hash("admin123"),
        department="Administration",
        job_title="Administrator",
        hire_date=datetime.now(UTC),
        role_id=role.id,
        employment_type=EmploymentType.FULL_TIME,
        is_active=True,
        annual_salary=Decimal("100000.00"),
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    from app.core.tokens import JwtTokenService

    token_service = JwtTokenService()
    return token_service.create_access_token(str(admin.id), "ADMIN")


def test_list_employees_requires_permission(client: TestClient) -> None:
    """Test that listing employees requires authentication."""
    response = client.get("/api/v1/employees")
    assert response.status_code == 401


def test_list_employees_authenticated(
    client: TestClient, admin_token: str
) -> None:
    """Test listing employees with valid token."""
    response = client.get(
        "/api/v1/employees", headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data


def test_create_employee_requires_permission(client: TestClient) -> None:
    """Test that creating employee requires authentication."""
    response = client.post("/api/v1/employees", json={})
    assert response.status_code == 401


def test_create_employee_authenticated(
    client: TestClient, admin_token: str, db_session: Session
) -> None:
    """Test creating employee with valid token."""
    role = Role(name=RoleName.EMPLOYEE, description="Employee")
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)

    data = {
        "employment_type": "FULL_TIME",
        "employee_code": "EMP001",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "department": "Engineering",
        "job_title": "Engineer",
        "hire_date": datetime.now(UTC).isoformat(),
        "role_id": role.id,
        "password": "password123",
        "annual_salary": "75000.00",
        "hourly_rate": None,
        "contract_end_date": None,
    }

    response = client.post(
        "/api/v1/employees",
        json=data,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    result = response.json()
    assert result["email"] == "john@example.com"
    assert "password_hash" not in result
