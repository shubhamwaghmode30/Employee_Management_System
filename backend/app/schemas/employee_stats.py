"""Pydantic schemas for the employee dashboard summary."""

from pydantic import BaseModel

from app.domain.primitives import RoleName
from app.schemas.employee import EmployeeRead


class DepartmentHeadcount(BaseModel):
    """Number of non-deleted employees in one department."""

    department: str
    count: int


class RoleHeadcount(BaseModel):
    """Number of non-deleted employees holding one role."""

    role: RoleName
    count: int


class EmployeeStats(BaseModel):
    """Headcount figures for the dashboard, computed in one request."""

    total: int
    active: int
    inactive: int
    full_time: int
    contract: int
    by_department: list[DepartmentHeadcount]
    by_role: list[RoleHeadcount]
    recent_hires: list[EmployeeRead]
