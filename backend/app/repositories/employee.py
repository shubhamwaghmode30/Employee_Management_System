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
            query: Text search across first_name, last_name, and email
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
                )
            )

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = int(self.session.scalar(count_stmt) or 0)

        # Apply pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        results = list(self.session.scalars(stmt))
        return results, total

    def soft_delete(self, employee: Employee) -> Employee:
        """Soft delete an employee by setting deleted_at timestamp."""
        employee.deleted_at = datetime.now(UTC)
        self.session.flush()
        self.session.refresh(employee)
        return employee

    def _base_query(self) -> Select[tuple[Employee]]:
        """Build a base query excluding soft-deleted rows."""
        return super()._base_query().where(Employee.deleted_at.is_(None))
