"""Pydantic schemas for Employee model with discriminated unions."""

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
)

from app.domain.primitives import EmploymentType


class EmployeeBase(BaseModel):
    """Base schema for employee with common fields."""

    employee_code: str = Field(..., min_length=1, max_length=20)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(None, max_length=20)
    department: str = Field(..., min_length=1, max_length=100)
    job_title: str = Field(..., min_length=1, max_length=100)
    hire_date: datetime
    is_active: bool = True


class FullTimeEmployeeCreate(EmployeeBase):
    """Schema for creating a full-time employee."""

    employment_type: Literal[EmploymentType.FULL_TIME] = EmploymentType.FULL_TIME
    role_id: int = Field(..., gt=0)
    password: str = Field(..., min_length=8)
    annual_salary: Decimal = Field(..., ge=0, decimal_places=2, max_digits=10)


class ContractEmployeeCreate(EmployeeBase):
    """Schema for creating a contract employee."""

    employment_type: Literal[EmploymentType.CONTRACT] = EmploymentType.CONTRACT
    role_id: int = Field(..., gt=0)
    password: str = Field(..., min_length=8)
    hourly_rate: Decimal = Field(..., ge=0, decimal_places=2, max_digits=10)
    contract_end_date: datetime | None = None


class EmployeeCreate(BaseModel):
    """Discriminated union for creating any employee type."""

    employment_type: EmploymentType
    employee_code: str = Field(..., min_length=1, max_length=20)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(None, max_length=20)
    department: str = Field(..., min_length=1, max_length=100)
    job_title: str = Field(..., min_length=1, max_length=100)
    hire_date: datetime
    is_active: bool = True
    role_id: int = Field(..., gt=0)
    password: str = Field(..., min_length=8)
    annual_salary: Decimal | None = Field(None, ge=0, decimal_places=2, max_digits=10)
    hourly_rate: Decimal | None = Field(None, ge=0, decimal_places=2, max_digits=10)
    contract_end_date: datetime | None = None


class EmployeeUpdate(BaseModel):
    """Schema for updating an employee (all fields optional)."""

    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=20)
    department: str | None = Field(None, min_length=1, max_length=100)
    job_title: str | None = Field(None, min_length=1, max_length=100)
    is_active: bool | None = None
    annual_salary: Decimal | None = Field(None, ge=0, decimal_places=2, max_digits=10)
    hourly_rate: Decimal | None = Field(None, ge=0, decimal_places=2, max_digits=10)
    contract_end_date: datetime | None = None


class EmployeeRead(BaseModel):
    """Schema for reading an employee (never exposes password_hash)."""

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: str
    employee_code: str
    first_name: str
    last_name: str
    email: str
    phone: str | None = None
    department: str
    job_title: str
    hire_date: datetime
    is_active: bool
    role_id: int
    employment_type: EmploymentType
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
    annual_salary: Decimal | None = None
    hourly_rate: Decimal | None = None
    contract_end_date: datetime | None = None


class PaginatedEmployees(BaseModel):
    """Schema for paginated employee list response."""

    items: list[EmployeeRead]
    total: int
    page: int
    page_size: int


class EmployeeSearchParams(BaseModel):
    """Schema for employee search parameters."""

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
    q: str | None = Field(default=None, max_length=100)
    department: str | None = Field(default=None, max_length=100)
    is_active: bool | None = None
