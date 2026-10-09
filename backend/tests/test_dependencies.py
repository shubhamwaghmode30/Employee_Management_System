"""Tests for authentication and authorization dependencies."""

from collections.abc import Generator
from datetime import UTC, datetime

import pytest
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.dependencies import get_current_employee
from app.core.database import Base
from app.core.security import Argon2PasswordHasher
from app.core.tokens import JwtTokenService
from app.domain.primitives import EmploymentType, RoleName
from app.models.employee import FullTimeEmployee
from app.models.role import Role
from app.repositories.employee import EmployeeRepository


@pytest.fixture
def in_memory_db() -> Generator:
    """Create an in-memory SQLite database for testing."""
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    yield TestingSessionLocal
    Base.metadata.drop_all(engine)


@pytest.fixture
def db_session(in_memory_db: Generator) -> Generator:
    """Create a database session for testing."""
    session = in_memory_db()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def employee(db_session: Generator) -> FullTimeEmployee:
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


def test_get_current_employee_with_valid_token(
    db_session: Generator, employee: FullTimeEmployee
) -> None:
    """Test that valid token returns employee."""
    token_service = JwtTokenService()
    employee_repo = EmployeeRepository(db_session)

    token = token_service.create_access_token(str(employee.id), "EMPLOYEE")
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer", credentials=token
    )

    result = get_current_employee(credentials, employee_repo, token_service)
    assert result.id == employee.id


def test_get_current_employee_with_invalid_token_raises_401(
    db_session: Generator,
) -> None:
    """Test that invalid token raises 401."""
    token_service = JwtTokenService()
    employee_repo = EmployeeRepository(db_session)

    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer", credentials="invalid-token"
    )

    with pytest.raises(HTTPException) as exc:
        get_current_employee(credentials, employee_repo, token_service)

    assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
