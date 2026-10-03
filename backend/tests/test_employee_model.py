"""Model-level tests for Employee polymorphism."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.domain.primitives import EmploymentType, RoleName
from app.models.employee import ContractEmployee, Employee, FullTimeEmployee
from app.models.role import Role


def test_employee_polymorphism() -> None:
    """Test that subclasses are correctly instantiated and queried."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    role = Role(name=RoleName.ADMIN, description="Administrator")
    session.add(role)
    session.commit()

    full_time = FullTimeEmployee(
        employee_code="FT001",
        first_name="John",
        last_name="Doe",
        email="john.doe@example.com",
        password_hash="hashed_password",  # noqa: S106
        phone="555-1234",
        department="Engineering",
        job_title="Senior Engineer",
        hire_date=datetime.now(UTC),
        is_active=True,
        role_id=role.id,
        employment_type=EmploymentType.FULL_TIME,
        annual_salary=Decimal("120000.00"),
    )
    session.add(full_time)

    contract = ContractEmployee(
        employee_code="CT001",
        first_name="Jane",
        last_name="Smith",
        email="jane.smith@example.com",
        password_hash="hashed_password",  # noqa: S106
        phone="555-5678",
        department="Marketing",
        job_title="Marketing Specialist",
        hire_date=datetime.now(UTC),
        is_active=True,
        role_id=role.id,
        employment_type=EmploymentType.CONTRACT,
        hourly_rate=Decimal("50.00"),
        contract_end_date=datetime.now(UTC) + timedelta(days=180),
    )
    session.add(contract)
    session.commit()

    employees = session.query(Employee).all()
    assert len(employees) == 2

    ft_employee = employees[0]
    assert isinstance(ft_employee, FullTimeEmployee)
    assert ft_employee.annual_salary == Decimal("120000.00")
    assert "Full Time" in ft_employee.summary_label()
    assert "$120,000.00" in ft_employee.summary_label()

    ct_employee = employees[1]
    assert isinstance(ct_employee, ContractEmployee)
    assert ct_employee.hourly_rate == Decimal("50.00")
    assert "Contract" in ct_employee.summary_label()
    assert "$50.00" in ct_employee.summary_label()

    session.close()
