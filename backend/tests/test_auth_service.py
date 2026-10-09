"""Tests for authentication service."""

from collections.abc import Generator
from datetime import UTC, datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.security import Argon2PasswordHasher
from app.core.tokens import JwtTokenService
from app.domain.primitives import EmploymentType, RoleName
from app.models.employee import FullTimeEmployee
from app.models.role import Role
from app.repositories.employee import EmployeeRepository
from app.repositories.role import RoleRepository
from app.services.auth import AuthService


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
def hasher() -> Argon2PasswordHasher:
    """Create a password hasher."""
    return Argon2PasswordHasher()


@pytest.fixture
def token_service() -> JwtTokenService:
    """Create a token service."""
    return JwtTokenService()


def test_login_success(
    db_session: Generator, hasher: Argon2PasswordHasher, token_service: JwtTokenService
) -> None:
    """Test successful login returns tokens."""
    role = Role(name=RoleName.ADMIN, description="Admin")
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

    employee_repo = EmployeeRepository(db_session)
    role_repo = RoleRepository(db_session)
    auth_service = AuthService(employee_repo, role_repo, hasher, token_service)

    access_token, refresh_token = auth_service.login("john@example.com", "password123")

    assert access_token
    assert refresh_token
    assert access_token != refresh_token


def test_login_wrong_password_raises_error(
    db_session: Generator, hasher: Argon2PasswordHasher, token_service: JwtTokenService
) -> None:
    """Test that wrong password raises error."""
    role = Role(name=RoleName.ADMIN, description="Admin")
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

    employee_repo = EmployeeRepository(db_session)
    role_repo = RoleRepository(db_session)
    auth_service = AuthService(employee_repo, role_repo, hasher, token_service)

    with pytest.raises(ValueError, match="Invalid email or password"):
        auth_service.login("john@example.com", "wrong-password")


def test_login_inactive_user_raises_error(
    db_session: Generator, hasher: Argon2PasswordHasher, token_service: JwtTokenService
) -> None:
    """Test that inactive user cannot login."""
    role = Role(name=RoleName.ADMIN, description="Admin")
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
        is_active=False,
    )
    db_session.add(employee)
    db_session.commit()

    employee_repo = EmployeeRepository(db_session)
    role_repo = RoleRepository(db_session)
    auth_service = AuthService(employee_repo, role_repo, hasher, token_service)

    with pytest.raises(ValueError, match="Invalid email or password"):
        auth_service.login("john@example.com", "password123")


def test_refresh_issues_new_access_token(
    db_session: Generator, hasher: Argon2PasswordHasher, token_service: JwtTokenService
) -> None:
    """Test that refresh issues a new access token."""
    role = Role(name=RoleName.ADMIN, description="Admin")
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

    employee_repo = EmployeeRepository(db_session)
    role_repo = RoleRepository(db_session)
    auth_service = AuthService(employee_repo, role_repo, hasher, token_service)

    _, refresh_token = auth_service.login("john@example.com", "password123")
    new_access_token = auth_service.refresh(refresh_token)

    assert new_access_token
    assert new_access_token != refresh_token
