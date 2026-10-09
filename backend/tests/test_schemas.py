"""Tests for Pydantic schemas."""

from datetime import UTC, datetime
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.domain.primitives import EmploymentType
from app.schemas.employee import (
    ContractEmployeeCreate,
    EmployeeCreate,
    EmployeeUpdate,
    FullTimeEmployeeCreate,
)


class TestEmployeeCreate:
    """Tests for EmployeeCreate schema."""

    def test_full_time_employee_valid(self) -> None:
        """Test creating a valid full-time employee."""
        data = {
            "employment_type": EmploymentType.FULL_TIME,
            "employee_code": "EMP001",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "department": "Engineering",
            "job_title": "Software Engineer",
            "hire_date": datetime.now(UTC),
            "annual_salary": Decimal("75000.00"),
        }
        employee = EmployeeCreate(**data)
        assert employee.employment_type == EmploymentType.FULL_TIME
        assert employee.annual_salary == Decimal("75000.00")

    def test_contract_employee_valid(self) -> None:
        """Test creating a valid contract employee."""
        data = {
            "employment_type": EmploymentType.CONTRACT,
            "employee_code": "EMP002",
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@example.com",
            "department": "HR",
            "job_title": "HR Manager",
            "hire_date": datetime.now(UTC),
            "hourly_rate": Decimal("50.00"),
        }
        employee = EmployeeCreate(**data)
        assert employee.employment_type == EmploymentType.CONTRACT
        assert employee.hourly_rate == Decimal("50.00")

    def test_full_time_missing_salary_raises_error(self) -> None:
        """Test that full-time employee without salary raises validation error."""
        data = {
            "employee_code": "EMP001",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "department": "Engineering",
            "job_title": "Software Engineer",
            "hire_date": datetime.now(UTC),
        }
        with pytest.raises(ValidationError):
            FullTimeEmployeeCreate(**data)

    def test_contract_missing_hourly_rate_raises_error(self) -> None:
        """Test that contract employee without hourly rate raises validation error."""
        data = {
            "employee_code": "EMP002",
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@example.com",
            "department": "HR",
            "job_title": "HR Manager",
            "hire_date": datetime.now(UTC),
        }
        with pytest.raises(ValidationError):
            ContractEmployeeCreate(**data)

    def test_negative_salary_raises_error(self) -> None:
        """Test that negative salary raises validation error."""
        data = {
            "employment_type": EmploymentType.FULL_TIME,
            "employee_code": "EMP001",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "department": "Engineering",
            "job_title": "Software Engineer",
            "hire_date": datetime.now(UTC),
            "annual_salary": Decimal("-1000.00"),
        }
        with pytest.raises(ValueError):
            EmployeeCreate(**data)

    def test_invalid_email_raises_error(self) -> None:
        """Test that invalid email raises validation error."""
        data = {
            "employment_type": EmploymentType.FULL_TIME,
            "employee_code": "EMP001",
            "first_name": "John",
            "last_name": "Doe",
            "email": "not-an-email",
            "department": "Engineering",
            "job_title": "Software Engineer",
            "hire_date": datetime.now(UTC),
            "annual_salary": Decimal("75000.00"),
        }
        with pytest.raises(ValueError):
            EmployeeCreate(**data)


class TestEmployeeUpdate:
    """Tests for EmployeeUpdate schema."""

    def test_partial_update_valid(self) -> None:
        """Test that partial update with only some fields is valid."""
        data = {"first_name": "Updated", "department": "Sales"}
        update = EmployeeUpdate(**data)
        assert update.first_name == "Updated"
        assert update.department == "Sales"
        assert update.last_name is None

    def test_empty_update_valid(self) -> None:
        """Test that empty update is valid."""
        update = EmployeeUpdate()
        assert update.first_name is None
        assert update.last_name is None


class TestFullTimeEmployeeCreate:
    """Tests for FullTimeEmployeeCreate schema."""

    def test_literal_employment_type(self) -> None:
        """Test that employment_type is always FULL_TIME."""
        employee = FullTimeEmployeeCreate(
            employee_code="EMP001",
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com",
            department="Engineering",
            job_title="Software Engineer",
            hire_date=datetime.now(UTC),
            annual_salary=Decimal("75000.00"),
        )
        assert employee.employment_type == EmploymentType.FULL_TIME


class TestContractEmployeeCreate:
    """Tests for ContractEmployeeCreate schema."""

    def test_literal_employment_type(self) -> None:
        """Test that employment_type is always CONTRACT."""
        employee = ContractEmployeeCreate(
            employee_code="EMP002",
            first_name="Jane",
            last_name="Smith",
            email="jane.smith@example.com",
            department="HR",
            job_title="HR Manager",
            hire_date=datetime.now(UTC),
            hourly_rate=Decimal("50.00"),
        )
        assert employee.employment_type == EmploymentType.CONTRACT
