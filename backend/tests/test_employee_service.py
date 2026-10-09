"""Tests for employee service."""

from collections.abc import Generator
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.core.security import Argon2PasswordHasher
from app.domain.primitives import DuplicateEmailError, EmploymentType, RoleName
from app.models.role import Role
from app.repositories.employee import EmployeeRepository
from app.repositories.role import RoleRepository
from app.schemas.employee import EmployeeCreate
from app.services.employee import EmployeeService


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
def role(db_session: Generator) -> Role:
    """Create a test role."""
    role = Role(name=RoleName.EMPLOYEE, description="Employee")
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


def test_create_employee_hashes_password(
    db_session: Generator, role: Role, hasher: Argon2PasswordHasher
) -> None:
    """Test that password is hashed when creating employee."""
    employee_repo = EmployeeRepository(db_session)
    role_repo = RoleRepository(db_session)
    service = EmployeeService(employee_repo, role_repo, hasher)

    data = EmployeeCreate(
        employment_type=EmploymentType.FULL_TIME,
        employee_code="EMP001",
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        department="Engineering",
        job_title="Engineer",
        hire_date=datetime.now(UTC),
        role_id=role.id,
        password="password123",
        annual_salary=Decimal("75000.00"),
    )

    employee = service.create_employee(data)

    assert employee.password_hash != "password123"
    assert hasher.verify("password123", employee.password_hash)


def test_create_employee_duplicate_email_raises_error(
    db_session: Generator, role: Role, hasher: Argon2PasswordHasher
) -> None:
    """Test that duplicate email raises DuplicateEmailError."""
    employee_repo = EmployeeRepository(db_session)
    role_repo = RoleRepository(db_session)
    service = EmployeeService(employee_repo, role_repo, hasher)

    data = EmployeeCreate(
        employment_type=EmploymentType.FULL_TIME,
        employee_code="EMP001",
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        department="Engineering",
        job_title="Engineer",
        hire_date=datetime.now(UTC),
        role_id=role.id,
        password="password123",
        annual_salary=Decimal("75000.00"),
    )

    service.create_employee(data)

    data2 = EmployeeCreate(
        employment_type=EmploymentType.FULL_TIME,
        employee_code="EMP002",
        first_name="Jane",
        last_name="Smith",
        email="john@example.com",
        department="HR",
        job_title="Manager",
        hire_date=datetime.now(UTC),
        role_id=role.id,
        password="password456",
        annual_salary=Decimal("80000.00"),
    )

    with pytest.raises(DuplicateEmailError):
        service.create_employee(data2)


def test_search_employees_paginated(
    db_session: Generator, role: Role, hasher: Argon2PasswordHasher
) -> None:
    """Test that search returns paginated results."""
    employee_repo = EmployeeRepository(db_session)
    role_repo = RoleRepository(db_session)
    service = EmployeeService(employee_repo, role_repo, hasher)

    for i in range(15):
        data = EmployeeCreate(
            employment_type=EmploymentType.FULL_TIME,
            employee_code=f"EMP{i:03d}",
            first_name=f"Employee{i}",
            last_name="Test",
            email=f"employee{i}@example.com",
            department="Engineering",
            job_title="Engineer",
            hire_date=datetime.now(UTC),
            role_id=role.id,
            password="password123",
            annual_salary=Decimal("50000.00"),
        )
        service.create_employee(data)

    employees, total = service.search_employees(page=1, page_size=10)

    assert len(employees) == 10
    assert total == 15
