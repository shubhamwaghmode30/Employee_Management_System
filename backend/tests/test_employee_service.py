"""Tests for employee service business rules."""

from collections.abc import Generator
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.core.security import Argon2PasswordHasher
from app.domain.primitives import (
    AuthorizationError,
    DuplicateEmailError,
    DuplicateEmployeeCodeError,
    EmploymentType,
    EntityNotFoundError,
    InvalidEmployeeDataError,
    RoleName,
    SelfActionError,
)
from app.models.employee import ContractEmployee, Employee, FullTimeEmployee
from app.models.role import Role
from app.repositories.employee import EmployeeRepository
from app.repositories.role import RoleRepository
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.services.employee import EmployeeService


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Create an in-memory database session."""
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture
def hasher() -> Argon2PasswordHasher:
    """Create a password hasher."""
    return Argon2PasswordHasher()


@pytest.fixture
def roles(default_roles: dict[RoleName, Role]) -> dict[RoleName, Role]:
    """Create the three system roles with their default grants."""
    return default_roles


@pytest.fixture
def service(db_session: Session, hasher: Argon2PasswordHasher) -> EmployeeService:
    """Create the service under test."""
    return EmployeeService(
        EmployeeRepository(db_session), RoleRepository(db_session), hasher
    )


def add_staff(
    db_session: Session,
    hasher: Argon2PasswordHasher,
    role: Role,
    email: str,
    employee_code: str,
) -> FullTimeEmployee:
    """Persist a full-time employee with the given role."""
    first_name, last_name = email.split("@")[0].split(".")
    employee = FullTimeEmployee(
        employee_code=employee_code,
        first_name=first_name.title(),
        last_name=last_name.title(),
        email=email,
        password_hash=hasher.hash("Welcome@2026"),
        department="Human Resources",
        job_title="People Partner",
        hire_date=datetime(2023, 4, 3, tzinfo=UTC),
        role_id=role.id,
        employment_type=EmploymentType.FULL_TIME,
        annual_salary=Decimal("92000.00"),
    )
    db_session.add(employee)
    db_session.commit()
    return employee


@pytest.fixture
def admin(
    db_session: Session, hasher: Argon2PasswordHasher, roles: dict[RoleName, Role]
) -> FullTimeEmployee:
    """Create an admin actor."""
    return add_staff(
        db_session, hasher, roles[RoleName.ADMIN], "neha.kapoor@company.com", "ADM001"
    )


@pytest.fixture
def hr_manager(
    db_session: Session, hasher: Argon2PasswordHasher, roles: dict[RoleName, Role]
) -> FullTimeEmployee:
    """Create an HR manager actor."""
    return add_staff(
        db_session,
        hasher,
        roles[RoleName.HR_MANAGER],
        "priya.sharma@company.com",
        "HRM001",
    )


def full_time_payload(
    role: Role,
    email: str = "arjun.mehta@company.com",
    employee_code: str = "ENG001",
) -> EmployeeCreate:
    """Build a valid full-time create payload."""
    return EmployeeCreate(
        employment_type=EmploymentType.FULL_TIME,
        employee_code=employee_code,
        first_name="Arjun",
        last_name="Mehta",
        email=email,
        department="Engineering",
        job_title="Backend Engineer",
        hire_date=datetime(2024, 1, 15, tzinfo=UTC),
        role_id=role.id,
        password="Secure@Pass1",
        annual_salary=Decimal("85000.00"),
    )


def contract_payload(role: Role) -> EmployeeCreate:
    """Build a valid contract create payload."""
    return EmployeeCreate(
        employment_type=EmploymentType.CONTRACT,
        employee_code="CON001",
        first_name="Rahul",
        last_name="Verma",
        email="rahul.verma@company.com",
        department="Design",
        job_title="UX Consultant",
        hire_date=datetime(2025, 2, 1, tzinfo=UTC),
        role_id=role.id,
        password="Secure@Pass1",
        hourly_rate=Decimal("65.00"),
        contract_end_date=datetime(2026, 12, 31, tzinfo=UTC),
    )


class TestCreateEmployee:
    def test_hashes_password_through_hasher(
        self,
        service: EmployeeService,
        roles: dict[RoleName, Role],
        admin: Employee,
        hasher: Argon2PasswordHasher,
    ) -> None:
        employee = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )

        assert employee.password_hash != "Secure@Pass1"
        assert hasher.verify("Secure@Pass1", employee.password_hash)

    def test_creates_contract_employee_with_contract_fields(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        employee = service.create_employee(
            contract_payload(roles[RoleName.EMPLOYEE]), admin
        )

        assert isinstance(employee, ContractEmployee)
        assert employee.hourly_rate == Decimal("65.00")

    def test_rejects_duplicate_email_case_insensitively(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        role = roles[RoleName.EMPLOYEE]
        service.create_employee(full_time_payload(role), admin)

        with pytest.raises(DuplicateEmailError):
            service.create_employee(
                full_time_payload(role, "Arjun.Mehta@company.com", "ENG002"), admin
            )

    def test_rejects_duplicate_employee_code(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        role = roles[RoleName.EMPLOYEE]
        service.create_employee(full_time_payload(role), admin)

        with pytest.raises(DuplicateEmployeeCodeError):
            service.create_employee(
                full_time_payload(role, "kavya.iyer@company.com", "ENG001"), admin
            )

    def test_reuses_email_and_code_of_soft_deleted_employee(
        self,
        service: EmployeeService,
        roles: dict[RoleName, Role],
        admin: Employee,
    ) -> None:
        role = roles[RoleName.EMPLOYEE]
        created = service.create_employee(full_time_payload(role), admin)
        service.delete_employee(str(created.id), admin)

        rehired = service.create_employee(full_time_payload(role), admin)

        assert rehired.id != created.id
        assert rehired.email == created.email

    def test_rejects_unknown_role(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        payload = full_time_payload(roles[RoleName.EMPLOYEE]).model_copy(
            update={"role_id": 999}
        )

        with pytest.raises(InvalidEmployeeDataError):
            service.create_employee(payload, admin)

    def test_hr_manager_cannot_assign_admin_role(
        self,
        service: EmployeeService,
        roles: dict[RoleName, Role],
        hr_manager: Employee,
    ) -> None:
        with pytest.raises(AuthorizationError):
            service.create_employee(
                full_time_payload(roles[RoleName.ADMIN]), hr_manager
            )

    def test_admin_can_assign_admin_role(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        employee = service.create_employee(
            full_time_payload(roles[RoleName.ADMIN]), admin
        )

        assert employee.role_id == roles[RoleName.ADMIN].id


class TestGetEmployee:
    def test_raises_not_found_for_unknown_id(self, service: EmployeeService) -> None:
        with pytest.raises(EntityNotFoundError):
            service.get_employee("7d4f8a52-0000-4000-8000-000000000000")

    def test_raises_not_found_for_soft_deleted(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        created = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )
        service.delete_employee(str(created.id), admin)

        with pytest.raises(EntityNotFoundError):
            service.get_employee(str(created.id))


class TestUpdateEmployee:
    def test_updates_only_sent_fields(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        created = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )

        updated = service.update_employee(
            str(created.id),
            EmployeeUpdate(job_title="Senior Backend Engineer"),
            admin,
        )

        assert updated.job_title == "Senior Backend Engineer"
        assert updated.department == "Engineering"

    def test_never_changes_password_hash(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        created = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )
        original_hash = created.password_hash

        updated = service.update_employee(
            str(created.id), EmployeeUpdate(department="Platform"), admin
        )

        assert updated.password_hash == original_hash

    def test_clears_phone_when_sent_as_null(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        payload = full_time_payload(roles[RoleName.EMPLOYEE]).model_copy(
            update={"phone": "+91 98200 12345"}
        )
        created = service.create_employee(payload, admin)

        updated = service.update_employee(
            str(created.id), EmployeeUpdate.model_validate({"phone": None}), admin
        )

        assert updated.phone is None

    def test_rejects_email_owned_by_someone_else(
        self,
        service: EmployeeService,
        roles: dict[RoleName, Role],
        admin: Employee,
        hr_manager: Employee,
    ) -> None:
        created = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )

        with pytest.raises(DuplicateEmailError):
            service.update_employee(
                str(created.id), EmployeeUpdate(email=hr_manager.email), admin
            )

    def test_cannot_deactivate_self(
        self, service: EmployeeService, admin: Employee
    ) -> None:
        with pytest.raises(SelfActionError):
            service.update_employee(
                str(admin.id), EmployeeUpdate(is_active=False), admin
            )

    def test_can_deactivate_someone_else(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        created = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )

        updated = service.update_employee(
            str(created.id), EmployeeUpdate(is_active=False), admin
        )

        assert updated.is_active is False

    def test_hr_manager_cannot_promote_to_admin(
        self,
        service: EmployeeService,
        roles: dict[RoleName, Role],
        admin: Employee,
        hr_manager: Employee,
    ) -> None:
        created = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )

        with pytest.raises(AuthorizationError):
            service.update_employee(
                str(created.id),
                EmployeeUpdate(role_id=roles[RoleName.ADMIN].id),
                hr_manager,
            )

    def test_rejects_contract_fields_on_full_time_employee(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        created = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )

        with pytest.raises(InvalidEmployeeDataError):
            service.update_employee(
                str(created.id), EmployeeUpdate(hourly_rate=Decimal("40.00")), admin
            )

    def test_rejects_null_for_required_field(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        created = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )

        with pytest.raises(InvalidEmployeeDataError):
            service.update_employee(
                str(created.id),
                EmployeeUpdate.model_validate({"department": None}),
                admin,
            )

    def test_updates_contract_end_date(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        created = service.create_employee(
            contract_payload(roles[RoleName.EMPLOYEE]), admin
        )
        new_end = datetime(2027, 6, 30, tzinfo=UTC)

        updated = service.update_employee(
            str(created.id), EmployeeUpdate(contract_end_date=new_end), admin
        )

        assert isinstance(updated, ContractEmployee)
        assert updated.contract_end_date is not None
        assert updated.contract_end_date.date() == new_end.date()


class TestDeleteEmployee:
    def test_soft_deletes_employee(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        created = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )

        service.delete_employee(str(created.id), admin)

        assert created.deleted_at is not None
        assert created.deleted_by_id == str(admin.id)

    def test_cannot_delete_self(
        self, service: EmployeeService, admin: Employee
    ) -> None:
        with pytest.raises(SelfActionError):
            service.delete_employee(str(admin.id), admin)


class TestRestoreEmployee:
    def test_restores_soft_deleted_employee(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        created = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )
        service.delete_employee(str(created.id), admin)

        restored = service.restore_employee(str(created.id))

        assert restored.deleted_at is None
        assert restored.deleted_by_id is None
        assert service.get_employee(str(created.id)).id == created.id

    def test_lists_deleted_employees(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        created = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )
        service.delete_employee(str(created.id), admin)

        deleted, total = service.list_deleted_employees()

        assert total == 1
        assert [employee.id for employee in deleted] == [created.id]

    def test_live_employee_cannot_be_restored(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        created = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )

        with pytest.raises(EntityNotFoundError):
            service.restore_employee(str(created.id))

    def test_restore_rejects_email_reused_by_live_employee(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        role = roles[RoleName.EMPLOYEE]
        created = service.create_employee(full_time_payload(role), admin)
        service.delete_employee(str(created.id), admin)
        service.create_employee(full_time_payload(role, employee_code="ENG002"), admin)

        with pytest.raises(DuplicateEmailError):
            service.restore_employee(str(created.id))

    def test_restore_rejects_code_reused_by_live_employee(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        role = roles[RoleName.EMPLOYEE]
        created = service.create_employee(full_time_payload(role), admin)
        service.delete_employee(str(created.id), admin)
        service.create_employee(
            full_time_payload(role, "kavya.iyer@company.com"), admin
        )

        with pytest.raises(DuplicateEmployeeCodeError):
            service.restore_employee(str(created.id))


class TestChangePassword:
    def test_changes_password_after_verifying_current(
        self,
        service: EmployeeService,
        admin: Employee,
        hasher: Argon2PasswordHasher,
    ) -> None:
        service.change_password(admin, "Welcome@2026", "Fresh@Pass2027")

        assert hasher.verify("Fresh@Pass2027", admin.password_hash)

    def test_rejects_wrong_current_password(
        self, service: EmployeeService, admin: Employee
    ) -> None:
        with pytest.raises(InvalidEmployeeDataError):
            service.change_password(admin, "Wrong@Pass1", "Fresh@Pass2027")

    def test_rejects_reusing_current_password(
        self, service: EmployeeService, admin: Employee
    ) -> None:
        with pytest.raises(InvalidEmployeeDataError):
            service.change_password(admin, "Welcome@2026", "Welcome@2026")


class TestSearchAndDepartments:
    def test_search_is_paginated(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        role = roles[RoleName.EMPLOYEE]
        for index in range(15):
            service.create_employee(
                full_time_payload(
                    role, f"analyst.{index:02d}@company.com", f"ANL{index:03d}"
                ),
                admin,
            )

        employees, total = service.search_employees(page=2, page_size=10)

        assert len(employees) == 6
        assert total == 16

    def test_lists_distinct_departments(
        self, service: EmployeeService, roles: dict[RoleName, Role], admin: Employee
    ) -> None:
        service.create_employee(full_time_payload(roles[RoleName.EMPLOYEE]), admin)
        service.create_employee(contract_payload(roles[RoleName.EMPLOYEE]), admin)

        assert service.list_departments() == [
            "Design",
            "Engineering",
            "Human Resources",
        ]

    def test_summarises_headcount_for_the_dashboard(
        self,
        service: EmployeeService,
        roles: dict[RoleName, Role],
        admin: Employee,
        hr_manager: Employee,
    ) -> None:
        engineer = service.create_employee(
            full_time_payload(roles[RoleName.EMPLOYEE]), admin
        )
        service.create_employee(contract_payload(roles[RoleName.EMPLOYEE]), admin)
        service.update_employee(
            str(engineer.id), EmployeeUpdate(is_active=False), admin
        )
        departed = service.create_employee(
            full_time_payload(
                roles[RoleName.EMPLOYEE], "kavya.iyer@company.com", "ENG002"
            ),
            admin,
        )
        service.delete_employee(str(departed.id), admin)

        stats = service.get_stats()

        assert (stats.total, stats.active, stats.inactive) == (4, 3, 1)
        assert (stats.full_time, stats.contract) == (3, 1)
        assert [(entry.department, entry.count) for entry in stats.by_department] == [
            ("Human Resources", 2),
            ("Design", 1),
            ("Engineering", 1),
        ]
        assert [(entry.role, entry.count) for entry in stats.by_role] == [
            (RoleName.ADMIN, 1),
            (RoleName.HR_MANAGER, 1),
            (RoleName.EMPLOYEE, 2),
        ]
        assert [employee.email for employee in stats.recent_hires][:2] == [
            "rahul.verma@company.com",
            "arjun.mehta@company.com",
        ]
