"""Tests for repository layer using in-memory SQLite."""

from collections.abc import Generator
from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.domain.primitives import EmploymentType, RoleName
from app.models.employee import ContractEmployee, FullTimeEmployee
from app.models.role import Role
from app.repositories.employee import EmployeeRepository
from app.repositories.role import RoleRepository


@pytest.fixture
def in_memory_db() -> Generator:
    """Create an in-memory SQLite database for testing."""
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    yield TestingSessionLocal
    Base.metadata.drop_all(engine)


@pytest.fixture
def db_session(in_memory_db: Generator) -> Generator:
    """Create a database session for testing."""
    session = in_memory_db()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def role_repo(db_session: Generator) -> RoleRepository:
    """Create a RoleRepository instance."""
    return RoleRepository(db_session)


@pytest.fixture
def employee_repo(db_session: Generator) -> EmployeeRepository:
    """Create an EmployeeRepository instance."""
    return EmployeeRepository(db_session)


@pytest.fixture
def sample_role(db_session: Generator) -> Role:
    """Create a sample role for testing."""
    role = Role(name=RoleName.ADMIN, description="Administrator role")
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def sample_employee(db_session: Generator, sample_role: Role) -> FullTimeEmployee:
    """Create a sample full-time employee for testing."""
    employee = FullTimeEmployee(
        employee_code="EMP001",
        first_name="John",
        last_name="Doe",
        email="john.doe@example.com",
        password_hash="hashed_password",
        department="Engineering",
        job_title="Software Engineer",
        hire_date=datetime.now(UTC),
        role_id=sample_role.id,
        annual_salary=Decimal("75000.00"),
    )
    db_session.add(employee)
    db_session.commit()
    db_session.refresh(employee)
    return employee


class TestRoleRepository:
    """Tests for RoleRepository."""

    def test_add_role(self, role_repo: RoleRepository) -> None:
        """Test adding a role."""
        role = Role(name=RoleName.HR_MANAGER, description="HR Manager role")
        result = role_repo.add(role)
        assert result.id is not None
        assert result.name == RoleName.HR_MANAGER

    def test_get_by_name(self, role_repo: RoleRepository, sample_role: Role) -> None:
        """Test retrieving a role by name."""
        result = role_repo.get_by_name(RoleName.ADMIN)
        assert result is not None
        assert result.id == sample_role.id
        assert result.name == RoleName.ADMIN

    def test_get_by_name_not_found(self, role_repo: RoleRepository) -> None:
        """Test retrieving a non-existent role by name."""
        result = role_repo.get_by_name(RoleName.EMPLOYEE)
        assert result is None

    def test_list_roles(self, role_repo: RoleRepository, sample_role: Role) -> None:
        """Test listing all roles."""
        role2 = Role(name=RoleName.EMPLOYEE, description="Employee role")
        role_repo.add(role2)
        roles = role_repo.list()
        assert len(roles) == 2


class TestEmployeeRepository:
    """Tests for EmployeeRepository."""

    def test_add_employee(
        self, employee_repo: EmployeeRepository, sample_role: Role
    ) -> None:
        """Test adding an employee."""
        employee = FullTimeEmployee(
            employee_code="EMP002",
            first_name="Jane",
            last_name="Smith",
            email="jane.smith@example.com",
            password_hash="hashed_password",
            department="HR",
            job_title="HR Manager",
            hire_date=datetime.now(UTC),
            role_id=sample_role.id,
            annual_salary=Decimal("65000.00"),
        )
        result = employee_repo.add(employee)
        assert result.id is not None
        assert result.email == "jane.smith@example.com"

    def test_get_by_email(
        self, employee_repo: EmployeeRepository, sample_employee: FullTimeEmployee
    ) -> None:
        """Test retrieving an employee by email."""
        result = employee_repo.get_by_email("john.doe@example.com")
        assert result is not None
        assert result.id == sample_employee.id
        assert result.email == "john.doe@example.com"

    def test_get_by_email_not_found(self, employee_repo: EmployeeRepository) -> None:
        """Test retrieving a non-existent employee by email."""
        result = employee_repo.get_by_email("nonexistent@example.com")
        assert result is None

    def test_get_by_id(
        self, employee_repo: EmployeeRepository, sample_employee: FullTimeEmployee
    ) -> None:
        """Test retrieving an employee by ID."""
        result = employee_repo.get_by_id(sample_employee.id)
        assert result is not None
        assert result.id == sample_employee.id

    def test_get_by_id_not_found(self, employee_repo: EmployeeRepository) -> None:
        """Test retrieving a non-existent employee by ID."""
        result = employee_repo.get_by_id(uuid4())
        assert result is None

    def test_soft_delete_excludes_from_queries(
        self, employee_repo: EmployeeRepository, sample_employee: FullTimeEmployee
    ) -> None:
        """Test that soft-deleted employees are excluded from queries."""
        employee_repo.soft_delete(sample_employee)
        result = employee_repo.get_by_email("john.doe@example.com")
        assert result is None

    def test_soft_delete_sets_timestamp(
        self, employee_repo: EmployeeRepository, sample_employee: FullTimeEmployee
    ) -> None:
        """Test that soft delete sets the deleted_at timestamp."""
        before_delete = sample_employee.deleted_at
        result = employee_repo.soft_delete(sample_employee)
        assert result.deleted_at is not None
        assert result.deleted_at > before_delete if before_delete else True

    def test_search_by_department(
        self,
        employee_repo: EmployeeRepository,
        sample_role: Role,
        sample_employee: FullTimeEmployee,
        db_session: Generator,
    ) -> None:
        """Test searching employees by department."""
        employee2 = FullTimeEmployee(
            employee_code="EMP003",
            first_name="Bob",
            last_name="Johnson",
            email="bob.johnson@example.com",
            password_hash="hashed_password",
            department="Marketing",
            job_title="Marketing Manager",
            hire_date=datetime.now(UTC),
            role_id=sample_role.id,
            annual_salary=Decimal("60000.00"),
        )
        db_session.add(employee2)
        db_session.commit()

        results, total = employee_repo.search(department="Engineering")
        assert total == 1
        assert len(results) == 1
        assert results[0].department == "Engineering"

    def test_search_by_active_status(
        self,
        employee_repo: EmployeeRepository,
        sample_role: Role,
        sample_employee: FullTimeEmployee,
        db_session: Generator,
    ) -> None:
        """Test searching employees by active status."""
        sample_employee.is_active = False
        db_session.commit()

        results, total = employee_repo.search(is_active=True)
        assert total == 0
        assert len(results) == 0

        results, total = employee_repo.search(is_active=False)
        assert total == 1
        assert len(results) == 1

    def test_search_with_text_query(
        self,
        employee_repo: EmployeeRepository,
        sample_role: Role,
        sample_employee: FullTimeEmployee,
        db_session: Generator,
    ) -> None:
        """Test searching employees with text query."""
        employee2 = FullTimeEmployee(
            employee_code="EMP004",
            first_name="Alice",
            last_name="Williams",
            email="alice.williams@example.com",
            password_hash="hashed_password",
            department="Engineering",
            job_title="Senior Engineer",
            hire_date=datetime.now(UTC),
            role_id=sample_role.id,
            annual_salary=Decimal("85000.00"),
        )
        db_session.add(employee2)
        db_session.commit()

        results, total = employee_repo.search(query="john")
        assert total == 1
        assert len(results) == 1
        assert "john" in results[0].first_name.lower()

    def test_search_pagination(
        self,
        employee_repo: EmployeeRepository,
        sample_role: Role,
        sample_employee: FullTimeEmployee,
        db_session: Generator,
    ) -> None:
        """Test search pagination."""
        for i in range(15):
            employee = FullTimeEmployee(
                employee_code=f"EMP{i+10:03d}",
                first_name=f"Employee{i}",
                last_name=f"Last{i}",
                email=f"employee{i}@example.com",
                password_hash="hashed_password",
                department="Engineering",
                job_title="Engineer",
                hire_date=datetime.now(UTC),
                role_id=sample_role.id,
                annual_salary=Decimal("50000.00"),
            )
            db_session.add(employee)
        db_session.commit()

        results, total = employee_repo.search(page=1, page_size=10)
        assert total == 16  # 15 new + 1 sample
        assert len(results) == 10

        results, total = employee_repo.search(page=2, page_size=10)
        assert total == 16
        assert len(results) == 6

    def test_search_combined_filters(
        self,
        employee_repo: EmployeeRepository,
        sample_role: Role,
        sample_employee: FullTimeEmployee,
        db_session: Generator,
    ) -> None:
        """Test search with multiple filters combined."""
        employee2 = FullTimeEmployee(
            employee_code="EMP005",
            first_name="John",
            last_name="Smith",
            email="john.smith@example.com",
            password_hash="hashed_password",
            department="Engineering",
            job_title="Senior Engineer",
            hire_date=datetime.now(UTC),
            role_id=sample_role.id,
            annual_salary=Decimal("90000.00"),
        )
        db_session.add(employee2)
        db_session.commit()

        results, total = employee_repo.search(
            department="Engineering", query="john", is_active=True
        )
        assert total == 2
        assert len(results) == 2

    def test_contract_employee_type(
        self, employee_repo: EmployeeRepository, sample_role: Role
    ) -> None:
        """Test that contract employees are handled correctly."""
        employee = ContractEmployee(
            employee_code="EMP006",
            first_name="Charlie",
            last_name="Brown",
            email="charlie.brown@example.com",
            password_hash="hashed_password",
            department="Engineering",
            job_title="Contract Developer",
            hire_date=datetime.now(UTC),
            role_id=sample_role.id,
            hourly_rate=Decimal("50.00"),
        )
        result = employee_repo.add(employee)
        assert result.employment_type == EmploymentType.CONTRACT
        assert result.hourly_rate == Decimal("50.00")
