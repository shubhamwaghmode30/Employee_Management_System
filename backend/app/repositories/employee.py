"""Repository for Employee model operations."""

from datetime import UTC, datetime

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.repositories.base import SqlAlchemyRepository


class EmployeeRepository(SqlAlchemyRepository[Employee]):
    """Repository for Employee model with custom queries."""

    def __init__(self, session: Session) -> None:
        """Initialize the employee repository."""
        super().__init__(session, Employee)

    def get_by_email(self, email: str) -> Employee | None:
        """Retrieve an employee by email, excluding soft-deleted rows."""
        stmt = self._base_query().where(Employee.email == email)
        return self.session.scalars(stmt).first()

    def get_by_id(self, id: int | str) -> Employee | None:
        """Retrieve an employee by ID, excluding soft-deleted rows."""
        stmt = self._base_query().where(Employee.id == id)
        return self.session.scalars(stmt).first()

    def is_email_taken(self, email: str, excluding_id: str | None = None) -> bool:
        """Check email uniqueness among live rows, ignoring case.

        Soft-deleted rows are left out: the database only enforces uniqueness
        for live rows, so their addresses may be reused.
        """
        stmt = select(Employee.id).where(
            Employee.deleted_at.is_(None),
            func.lower(Employee.email) == email.lower(),
        )
        if excluding_id is not None:
            stmt = stmt.where(Employee.id != excluding_id)
        return self.session.scalars(stmt).first() is not None

    def is_employee_code_taken(
        self, employee_code: str, excluding_id: str | None = None
    ) -> bool:
        """Check employee code uniqueness among live rows."""
        stmt = select(Employee.id).where(
            Employee.deleted_at.is_(None),
            Employee.employee_code == employee_code,
        )
        if excluding_id is not None:
            stmt = stmt.where(Employee.id != excluding_id)
        return self.session.scalars(stmt).first() is not None

    def get_deleted_by_id(self, id: str) -> Employee | None:
        """Retrieve a soft-deleted employee by ID."""
        stmt = (
            super()
            ._base_query()
            .where(Employee.id == id, Employee.deleted_at.is_not(None))
        )
        return self.session.scalars(stmt).first()

    def search_deleted(
        self, page: int = 1, page_size: int = 10
    ) -> tuple[list[Employee], int]:
        """Page through soft-deleted employees, most recently deleted first."""
        stmt = super()._base_query().where(Employee.deleted_at.is_not(None))
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int(self.session.scalar(count_stmt) or 0)
        stmt = (
            stmt.order_by(Employee.deleted_at.desc(), Employee.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(self.session.scalars(stmt)), total

    def list_departments(self) -> list[str]:
        """Return distinct departments of non-deleted employees, sorted."""
        stmt = (
            select(Employee.department)
            .where(Employee.deleted_at.is_(None))
            .distinct()
            .order_by(Employee.department)
        )
        return list(self.session.scalars(stmt))

    def count_by_department(self) -> list[tuple[str, int]]:
        """Count non-deleted employees per department, largest first."""
        headcount = func.count(Employee.id)
        stmt = (
            select(Employee.department, headcount)
            .where(Employee.deleted_at.is_(None))
            .group_by(Employee.department)
            .order_by(headcount.desc(), Employee.department)
        )
        return [
            (department, int(count))
            for department, count in self.session.execute(stmt)
        ]

    def count_by_status(self) -> dict[bool, int]:
        """Count non-deleted employees per is_active value."""
        stmt = (
            select(Employee.is_active, func.count(Employee.id))
            .where(Employee.deleted_at.is_(None))
            .group_by(Employee.is_active)
        )
        return {
            is_active: int(count) for is_active, count in self.session.execute(stmt)
        }

    def count_by_employment_type(self) -> dict[str, int]:
        """Count non-deleted employees per employment type."""
        stmt = (
            select(Employee.employment_type, func.count(Employee.id))
            .where(Employee.deleted_at.is_(None))
            .group_by(Employee.employment_type)
        )
        return {
            str(employment_type): int(count)
            for employment_type, count in self.session.execute(stmt)
        }

    def count_by_role_id(self) -> list[tuple[int, int]]:
        """Count non-deleted employees per role id."""
        stmt = (
            select(Employee.role_id, func.count(Employee.id))
            .where(Employee.deleted_at.is_(None))
            .group_by(Employee.role_id)
        )
        return [(role_id, int(count)) for role_id, count in self.session.execute(stmt)]

    def list_recent_hires(self, limit: int) -> list[Employee]:
        """Return the most recently hired non-deleted employees."""
        stmt = (
            self._base_query()
            .order_by(Employee.hire_date.desc(), Employee.last_name)
            .limit(limit)
        )
        return list(self.session.scalars(stmt))

    def search(
        self,
        department: str | None = None,
        is_active: bool | None = None,
        query: str | None = None,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Employee], int]:
        """Search employees with filters and pagination.

        Args:
            department: Filter by department (exact match)
            is_active: Filter by active status
            query: Text search across names, email and employee code
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Tuple of (list of employees, total count)
        """
        stmt = self._base_query()

        if department is not None:
            stmt = stmt.where(Employee.department == department)

        if is_active is not None:
            stmt = stmt.where(Employee.is_active == is_active)

        if query:
            search_pattern = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Employee.first_name.ilike(search_pattern),
                    Employee.last_name.ilike(search_pattern),
                    Employee.email.ilike(search_pattern),
                    Employee.employee_code.ilike(search_pattern),
                )
            )

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int(self.session.scalar(count_stmt) or 0)

        # Stable ordering keeps pages from overlapping between requests.
        offset = (page - 1) * page_size
        stmt = (
            stmt.order_by(Employee.last_name, Employee.first_name, Employee.id)
            .offset(offset)
            .limit(page_size)
        )

        results = list(self.session.scalars(stmt))
        return results, total

    def soft_delete(self, employee: Employee, deleted_by_id: str) -> Employee:
        """Soft delete an employee, recording when and by whom."""
        employee.deleted_at = datetime.now(UTC)
        employee.deleted_by_id = deleted_by_id
        self.session.flush()
        self.session.refresh(employee)
        return employee

    def restore(self, employee: Employee) -> Employee:
        """Bring a soft-deleted employee back into the live set."""
        employee.deleted_at = None
        employee.deleted_by_id = None
        self.session.flush()
        self.session.refresh(employee)
        return employee

    def _base_query(self) -> Select[Employee]:
        """Build a base query excluding soft-deleted rows."""
        return super()._base_query().where(Employee.deleted_at.is_(None))
