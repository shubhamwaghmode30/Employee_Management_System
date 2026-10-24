"""Pydantic schemas for Employee model with discriminated unions."""

from datetime import datetime
from decimal import Decimal
from typing import Literal, Self

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    model_validator,
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

    @model_validator(mode="after")
    def check_pay_matches_employment_type(self) -> Self:
        """Require the pay fields of the chosen type and reject the other's."""
        if self.employment_type == EmploymentType.FULL_TIME:
            if self.annual_salary is None:
                raise ValueError("annual_salary is required for full-time employees")
            if self.hourly_rate is not None or self.contract_end_date is not None:
                raise ValueError(
                    "hourly_rate and contract_end_date apply to contract employees"
                )
        else:
            if self.hourly_rate is None:
                raise ValueError("hourly_rate is required for contract employees")
            if self.annual_salary is not None:
                raise ValueError("annual_salary applies to full-time employees")
        return self


class EmployeeUpdate(BaseModel):
    """Schema for updating an employee (all fields optional)."""

    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=20)
    department: str | None = Field(None, min_length=1, max_length=100)
    job_title: str | None = Field(None, min_length=1, max_length=100)
    is_active: bool | None = None
    role_id: int | None = Field(None, gt=0)
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


class EmployeeSummary(BaseModel):
    """List row: only what directory screens show, without pay or audit fields."""

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: str
    employee_code: str
    first_name: str
    last_name: str
    email: str
    department: str
    job_title: str
    hire_date: datetime
    is_active: bool
    role_id: int
    employment_type: EmploymentType


class DeletedEmployeeSummary(EmployeeSummary):
    """List row for a soft-deleted employee, with when and by whom."""

    deleted_at: datetime
    deleted_by_id: str | None = None


class PaginatedDeletedEmployees(BaseModel):
    """Schema for the paginated list of soft-deleted employees."""

    items: list[DeletedEmployeeSummary]
    total: int
    page: int
    page_size: int


class PaginatedEmployees(BaseModel):
    """Schema for paginated employee list response.

    Rows are summaries: a page of the directory never carries pay or audit
    fields, which GET /employees/{id} returns for one employee.
    """

    items: list[EmployeeSummary]
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



class EmailAvailabilityRequest(BaseModel):
    """Body for checking an email before submitting a whole employee form."""

    email: EmailStr
    excluding_id: str | None = Field(default=None, max_length=36)


class EmailAvailabilityResponse(BaseModel):
    """Whether no live employee other than excluding_id uses the email."""

    is_available: bool
