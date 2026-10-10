"""Employee service for business logic."""

from app.core.security import PasswordHasher
from app.domain.primitives import (
    AuthorizationError,
    DuplicateEmailError,
    DuplicateEmployeeCodeError,
    EmploymentType,
    EntityNotFoundError,
    InvalidEmployeeDataError,
    Permission,
    RoleName,
    SelfActionError,
)
from app.models.employee import ContractEmployee, Employee, FullTimeEmployee
from app.models.role import Role
from app.repositories.employee import EmployeeRepository
from app.repositories.role import RoleRepository
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


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

    def create_employee(self, data: EmployeeCreate, actor: Employee) -> Employee:
        """Create a new employee after enforcing uniqueness and role rules.

        Raises:
            DuplicateEmailError: The email is already registered.
            DuplicateEmployeeCodeError: The employee code is already used.
            InvalidEmployeeDataError: The role does not exist.
            AuthorizationError: A non-admin tried to assign the ADMIN role.
        """
        if self.employee_repo.is_email_taken(data.email):
            raise DuplicateEmailError(data.email)
        if self.employee_repo.is_employee_code_taken(data.employee_code):
            raise DuplicateEmployeeCodeError(data.employee_code)

        role = self._get_assignable_role(data.role_id, actor)
        password_hash = self.password_hasher.hash(data.password)

        if data.employment_type == EmploymentType.FULL_TIME:
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
                role_id=role.id,
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
                role_id=role.id,
                employment_type=data.employment_type,
                hourly_rate=data.hourly_rate,
                contract_end_date=data.contract_end_date,
            )

        return self.employee_repo.add(employee)

    def get_employee(self, employee_id: str) -> Employee:
        """Return a non-deleted employee.

        Raises:
            EntityNotFoundError: No such employee, or it was soft-deleted.
        """
        employee = self.employee_repo.get_by_id(employee_id)
        if employee is None:
            raise EntityNotFoundError("Employee", employee_id)
        return employee

    def update_employee(
        self, employee_id: str, data: EmployeeUpdate, actor: Employee
    ) -> Employee:
        """Apply a partial update. Only fields sent by the client are changed.

        The password hash is never touched here; use change_password.

        Raises:
            EntityNotFoundError: No such employee.
            DuplicateEmailError: The new email belongs to someone else.
            SelfActionError: The actor tried to deactivate themselves.
            AuthorizationError: A non-admin tried to grant the ADMIN role.
            InvalidEmployeeDataError: Pay fields do not match the employment
                type, or the role does not exist.
        """
        employee = self.get_employee(employee_id)
        changes = data.model_dump(exclude_unset=True)

        if data.is_active is False and employee.id == actor.id:
            raise SelfActionError("deactivate")
        if data.email is not None and self.employee_repo.is_email_taken(
            data.email, excluding_id=str(employee.id)
        ):
            raise DuplicateEmailError(data.email)
        if data.role_id is not None and data.role_id != employee.role_id:
            self._get_assignable_role(data.role_id, actor)

        self._check_pay_fields(employee, data)
        for required_field in ("first_name", "last_name", "department", "job_title"):
            if required_field in changes and changes[required_field] is None:
                raise InvalidEmployeeDataError(f"{required_field} cannot be empty")

        if data.first_name is not None:
            employee.first_name = data.first_name
        if data.last_name is not None:
            employee.last_name = data.last_name
        if data.email is not None:
            employee.email = data.email
        if "phone" in changes:
            employee.phone = data.phone
        if data.department is not None:
            employee.department = data.department
        if data.job_title is not None:
            employee.job_title = data.job_title
        if data.is_active is not None:
            employee.is_active = data.is_active
        if data.role_id is not None:
            employee.role_id = data.role_id
        if isinstance(employee, FullTimeEmployee) and data.annual_salary is not None:
            employee.annual_salary = data.annual_salary
        if isinstance(employee, ContractEmployee):
            if data.hourly_rate is not None:
                employee.hourly_rate = data.hourly_rate
            if "contract_end_date" in changes:
                employee.contract_end_date = data.contract_end_date

        return self.employee_repo.save(employee)

    def delete_employee(self, employee_id: str, actor: Employee) -> None:
        """Soft-delete an employee.

        Raises:
            EntityNotFoundError: No such employee.
            SelfActionError: The actor tried to delete themselves.
        """
        employee = self.get_employee(employee_id)
        if employee.id == actor.id:
            raise SelfActionError("delete")
        self.employee_repo.soft_delete(employee)

    def change_password(
        self, employee: Employee, current_password: str, new_password: str
    ) -> None:
        """Replace an employee's password after verifying the current one.

        Raises:
            InvalidEmployeeDataError: The current password is wrong, or the
                new password equals the current one.
        """
        if not self.password_hasher.verify(current_password, employee.password_hash):
            raise InvalidEmployeeDataError("Current password is incorrect")
        if current_password == new_password:
            raise InvalidEmployeeDataError(
                "New password must differ from the current password"
            )
        employee.password_hash = self.password_hasher.hash(new_password)
        self.employee_repo.save(employee)

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

    def list_departments(self) -> list[str]:
        """Return the departments currently in use."""
        return self.employee_repo.list_departments()

    def _get_assignable_role(self, role_id: int, actor: Employee) -> Role:
        """Load a role and check that the actor may grant it."""
        role = self.role_repo.get_by_id(role_id)
        if role is None:
            raise InvalidEmployeeDataError(f"Role {role_id} does not exist")
        if role.name == RoleName.ADMIN:
            actor_role = self.role_repo.get_by_id(actor.role_id)
            if actor_role is None or actor_role.name != RoleName.ADMIN:
                raise AuthorizationError(Permission.ROLE_ASSIGN)
        return role

    def _check_pay_fields(self, employee: Employee, data: EmployeeUpdate) -> None:
        """Reject pay fields that do not belong to the employee's type."""
        if isinstance(employee, FullTimeEmployee) and (
            data.hourly_rate is not None or data.contract_end_date is not None
        ):
            raise InvalidEmployeeDataError(
                "hourly_rate and contract_end_date apply to contract employees"
            )
        if isinstance(employee, ContractEmployee) and data.annual_salary is not None:
            raise InvalidEmployeeDataError(
                "annual_salary applies to full-time employees"
            )
