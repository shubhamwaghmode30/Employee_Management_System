"""Pydantic schemas for API request/response models."""

from app.schemas.employee import (
    ContractEmployeeCreate,
    EmployeeCreate,
    EmployeeRead,
    EmployeeUpdate,
    FullTimeEmployeeCreate,
    PaginatedEmployees,
)
from app.schemas.error import ErrorResponse
from app.schemas.health_response import HealthResponse
from app.schemas.role import RoleRead

__all__ = [
    "HealthResponse",
    "RoleRead",
    "EmployeeCreate",
    "EmployeeUpdate",
    "EmployeeRead",
    "PaginatedEmployees",
    "FullTimeEmployeeCreate",
    "ContractEmployeeCreate",
    "ErrorResponse",
]
