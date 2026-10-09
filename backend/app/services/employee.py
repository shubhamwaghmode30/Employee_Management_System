"""Employee service for business logic."""

from app.core.security import PasswordHasher
from app.domain.primitives import DuplicateEmailError
from app.models.employee import ContractEmployee, Employee, FullTimeEmployee
from app.repositories.employee import EmployeeRepository
from app.repositories.role import RoleRepository
from app.schemas.employee import EmployeeCreate


class EmployeeService:
    """Service for employee business logic."""

    def __init__(
        self,
        employee_repo: EmployeeRepository,
        role_repo: RoleRepository,
        password_hasher: PasswordHasher,
    ) -> None:
        """Initialize the employee service."""
        self.employee_repo = employee_repo
        self.role_repo = role_repo
        self.password_hasher = password_hasher

    def create_employee(self, data: EmployeeCreate) -> Employee:
        """Create a new employee with hashed password and unique email validation."""
        existing = self.employee_repo.get_by_email(data.email)
        if existing:
            raise DuplicateEmailError(
                f"Employee with email {data.email} already exists"
            )

        role = self.role_repo.get_by_id(data.role_id)
        if not role:
            raise ValueError("Role not found")

        password_hash = self.password_hasher.hash(data.password)

        if data.employment_type.value == "FULL_TIME":
            employee: Employee = FullTimeEmployee(
                employee_code=data.employee_code,
                first_name=data.first_name,
                last_name=data.last_name,
                email=data.email,
                password_hash=password_hash,
                phone=data.phone,
                department=data.department,
                job_title=data.job_title,
                hire_date=data.hire_date,
                is_active=data.is_active,
                role_id=data.role_id,
                employment_type=data.employment_type,
                annual_salary=data.annual_salary,
            )
        else:
            employee = ContractEmployee(
                employee_code=data.employee_code,
                first_name=data.first_name,
                last_name=data.last_name,
                email=data.email,
                password_hash=password_hash,
                phone=data.phone,
                department=data.department,
                job_title=data.job_title,
                hire_date=data.hire_date,
                is_active=data.is_active,
                role_id=data.role_id,
                employment_type=data.employment_type,
                hourly_rate=data.hourly_rate,
                contract_end_date=data.contract_end_date,
            )

        return self.employee_repo.add(employee)

    def search_employees(
        self,
        page: int = 1,
        page_size: int = 10,
        q: str | None = None,
        department: str | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[Employee], int]:
        """Search employees with pagination and filters."""
        return self.employee_repo.search(
            page=page,
            page_size=page_size,
            query=q,
            department=department,
            is_active=is_active,
        )
