"""Employee routes for CRUD operations."""

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.dependencies import (
    get_employee_repository,
    get_password_hasher,
    get_role_repository,
    require_permission,
)
from app.core.security import PasswordHasher
from app.domain.primitives import Permission
from app.models.employee import Employee
from app.repositories.employee import EmployeeRepository
from app.repositories.role import RoleRepository
from app.schemas.employee import (
    DeletedEmployeeSummary,
    EmailAvailabilityRequest,
    EmailAvailabilityResponse,
    EmployeeCreate,
    EmployeeRead,
    EmployeeSummary,
    EmployeeUpdate,
    PaginatedDeletedEmployees,
    PaginatedEmployees,
)
from app.schemas.employee_stats import EmployeeStats
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
        items=[EmployeeSummary.model_validate(employee) for employee in employees],
        total=total,
        page=page,
        page_size=page_size,
    )


@employee_router.get(
    "/departments",
    response_model=list[str],
    dependencies=[Depends(require_permission(Permission.EMPLOYEE_READ))],
)
def list_departments(
    employee_service: EmployeeService = Depends(get_employee_service),
) -> list[str]:
    """List the departments in use, for filter and form choices."""
    return employee_service.list_departments()


@employee_router.get(
    "/stats",
    response_model=EmployeeStats,
    dependencies=[Depends(require_permission(Permission.EMPLOYEE_READ))],
)
def get_employee_stats(
    employee_service: EmployeeService = Depends(get_employee_service),
) -> EmployeeStats:
    """Headcount summary for the dashboard."""
    return employee_service.get_stats()


@employee_router.post(
    "/email-availability",
    response_model=EmailAvailabilityResponse,
    dependencies=[Depends(require_permission(Permission.EMPLOYEE_READ))],
)
def check_email_availability(
    data: EmailAvailabilityRequest,
    employee_service: EmployeeService = Depends(get_employee_service),
) -> EmailAvailabilityResponse:
    """Check one email so forms need not send the whole record to find a clash.

    POST keeps the address out of URLs and access logs. Readers can already
    list emails, so this reveals nothing new to them.
    """
    return EmailAvailabilityResponse(
        is_available=employee_service.is_email_available(
            data.email, data.excluding_id
        )
    )


@employee_router.get(
    "/deleted",
    response_model=PaginatedDeletedEmployees,
    dependencies=[Depends(require_permission(Permission.EMPLOYEE_RESTORE))],
)
def list_deleted_employees(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    employee_service: EmployeeService = Depends(get_employee_service),
) -> PaginatedDeletedEmployees:
    """List soft-deleted employees, most recently deleted first."""
    employees, total = employee_service.list_deleted_employees(
        page=page, page_size=page_size
    )
    return PaginatedDeletedEmployees(
        items=[
            DeletedEmployeeSummary.model_validate(employee) for employee in employees
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@employee_router.post(
    "",
    response_model=EmployeeRead,
    status_code=status.HTTP_201_CREATED,
)
def create_employee(
    data: EmployeeCreate,
    actor: Employee = Depends(require_permission(Permission.EMPLOYEE_CREATE)),
    employee_service: EmployeeService = Depends(get_employee_service),
) -> EmployeeRead:
    """Create a new employee."""
    employee = employee_service.create_employee(data, actor)
    return EmployeeRead.model_validate(employee)


@employee_router.get(
    "/{employee_id}",
    response_model=EmployeeRead,
    dependencies=[Depends(require_permission(Permission.EMPLOYEE_READ))],
)
def get_employee(
    employee_id: str,
    employee_service: EmployeeService = Depends(get_employee_service),
) -> EmployeeRead:
    """Get one employee; 404 if missing or soft-deleted."""
    return EmployeeRead.model_validate(employee_service.get_employee(employee_id))


@employee_router.patch("/{employee_id}", response_model=EmployeeRead)
def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    actor: Employee = Depends(require_permission(Permission.EMPLOYEE_UPDATE)),
    employee_service: EmployeeService = Depends(get_employee_service),
) -> EmployeeRead:
    """Partially update an employee."""
    employee = employee_service.update_employee(employee_id, data, actor)
    return EmployeeRead.model_validate(employee)


@employee_router.delete(
    "/{employee_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_employee(
    employee_id: str,
    actor: Employee = Depends(require_permission(Permission.EMPLOYEE_DELETE)),
    employee_service: EmployeeService = Depends(get_employee_service),
) -> Response:
    """Soft-delete an employee."""
    employee_service.delete_employee(employee_id, actor)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@employee_router.post(
    "/{employee_id}/restore",
    response_model=EmployeeRead,
    dependencies=[Depends(require_permission(Permission.EMPLOYEE_RESTORE))],
)
def restore_employee(
    employee_id: str,
    employee_service: EmployeeService = Depends(get_employee_service),
) -> EmployeeRead:
    """Undo a soft delete; 409 if a live employee now holds the email or code."""
    return EmployeeRead.model_validate(employee_service.restore_employee(employee_id))
