"""Employee routes for CRUD operations."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import (
    get_employee_repository,
    get_password_hasher,
    get_role_repository,
    require_permission,
)
from app.core.security import PasswordHasher
from app.domain.primitives import DuplicateEmailError, Permission
from app.repositories.employee import EmployeeRepository
from app.repositories.role import RoleRepository
from app.schemas.employee import EmployeeCreate, EmployeeRead, PaginatedEmployees
from app.services.employee import EmployeeService

employee_router = APIRouter(prefix="/employees", tags=["employees"])


def get_employee_service(
    employee_repo: EmployeeRepository = Depends(get_employee_repository),
    role_repo: RoleRepository = Depends(get_role_repository),
    password_hasher: PasswordHasher = Depends(get_password_hasher),
) -> EmployeeService:
    """Dependency to get EmployeeService instance."""
    return EmployeeService(employee_repo, role_repo, password_hasher)


@employee_router.get(
    "",
    response_model=PaginatedEmployees,
    dependencies=[Depends(require_permission(Permission.EMPLOYEE_READ))],
)
def list_employees(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    q: str | None = Query(default=None, max_length=100),
    department: str | None = Query(default=None, max_length=100),
    is_active: bool | None = None,
    employee_service: EmployeeService = Depends(get_employee_service),
) -> PaginatedEmployees:
    """List employees with pagination and filters."""
    employees, total = employee_service.search_employees(
        page=page,
        page_size=page_size,
        q=q,
        department=department,
        is_active=is_active,
    )

    return PaginatedEmployees(
        items=[EmployeeRead.model_validate(emp) for emp in employees],
        total=total,
        page=page,
        page_size=page_size,
    )


@employee_router.post(
    "",
    response_model=EmployeeRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(Permission.EMPLOYEE_CREATE))],
)
def create_employee(
    data: EmployeeCreate,
    employee_service: EmployeeService = Depends(get_employee_service),
) -> EmployeeRead:
    """Create a new employee."""
    try:
        employee = employee_service.create_employee(data)
        return EmployeeRead.model_validate(employee)
    except DuplicateEmailError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
