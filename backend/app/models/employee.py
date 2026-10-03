"""Employee model with polymorphic employment types."""

from datetime import UTC, datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.primitives import EmploymentType

if TYPE_CHECKING:
    from app.models.role import Role


class Employee(Base):
    """Base employee model with single-table inheritance.

    Subclasses must implement summary_label().
    """

    __tablename__ = "employees"

    id: Mapped[UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    employee_code: Mapped[str] = mapped_column(
        String(20), unique=True, index=True, nullable=False
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    job_title: Mapped[str] = mapped_column(String(100), nullable=False)
    hire_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    employment_type: Mapped[EmploymentType] = mapped_column(
        String(50), nullable=False, default=EmploymentType.FULL_TIME
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )

    role: Mapped["Role"] = relationship("Role")

    __mapper_args__ = {
        "polymorphic_on": "employment_type",
    }

    def summary_label(self) -> str:
        """Return a human-readable summary of the employee.

        Subclasses must implement this method.
        """
        raise NotImplementedError


class FullTimeEmployee(Employee):
    """Full-time employee with annual salary."""

    __mapper_args__ = {
        "polymorphic_identity": EmploymentType.FULL_TIME,
    }

    annual_salary: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )

    def summary_label(self) -> str:
        if self.annual_salary is None:
            return f"{self.first_name} {self.last_name} - Full Time"
        salary_formatted = f"${self.annual_salary:,.2f}"
        return f"{self.first_name} {self.last_name} - Full Time ({salary_formatted})"


class ContractEmployee(Employee):
    """Contract employee with hourly rate and contract end date."""

    __mapper_args__ = {
        "polymorphic_identity": EmploymentType.CONTRACT,
    }

    hourly_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    contract_end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    def summary_label(self) -> str:
        if self.hourly_rate is None:
            return f"{self.first_name} {self.last_name} - Contract"
        rate_formatted = f"${self.hourly_rate}/hr"
        return f"{self.first_name} {self.last_name} - Contract ({rate_formatted})"
