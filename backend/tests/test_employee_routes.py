"""Integration tests for employee, role and password routes per role."""

from collections.abc import Generator
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import Argon2PasswordHasher
from app.core.tokens import JwtTokenService
from app.domain.primitives import EmploymentType, RoleName
from app.main import app
from app.models.employee import FullTimeEmployee
from app.models.role import Role

MISSING_ID = "7d4f8a52-0000-4000-8000-000000000000"
STAFF_PASSWORD = "Welcome@2026"


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Create a database session for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Create a test client that shares the test session."""

    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def roles(db_session: Session) -> dict[RoleName, Role]:
    """Create the three system roles."""
    created = {
        RoleName.ADMIN: Role(name=RoleName.ADMIN, description="Administrator"),
        RoleName.HR_MANAGER: Role(name=RoleName.HR_MANAGER, description="HR Manager"),
        RoleName.EMPLOYEE: Role(name=RoleName.EMPLOYEE, description="Employee"),
    }
    db_session.add_all(created.values())
    db_session.commit()
    return created


def add_staff(
    db_session: Session, role: Role, email: str, employee_code: str
) -> FullTimeEmployee:
    """Persist a staff member with a known password."""
    first_name, last_name = email.split("@")[0].split(".")
    staff = FullTimeEmployee(
        employee_code=employee_code,
        first_name=first_name.title(),
        last_name=last_name.title(),
        email=email,
        password_hash=Argon2PasswordHasher().hash(STAFF_PASSWORD),
        department="Human Resources",
        job_title="People Partner",
        hire_date=datetime(2023, 4, 3, tzinfo=UTC),
        role_id=role.id,
        employment_type=EmploymentType.FULL_TIME,
        annual_salary=Decimal("92000.00"),
    )
    db_session.add(staff)
    db_session.commit()
    return staff


def auth_headers(staff: FullTimeEmployee, role: RoleName) -> dict[str, str]:
    """Build a bearer header for a staff member."""
    token = JwtTokenService().create_access_token(str(staff.id), role.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin(db_session: Session, roles: dict[RoleName, Role]) -> FullTimeEmployee:
    """Create an admin."""
    return add_staff(
        db_session, roles[RoleName.ADMIN], "neha.kapoor@company.com", "ADM001"
    )


@pytest.fixture
def admin_headers(admin: FullTimeEmployee) -> dict[str, str]:
    """Bearer header for the admin."""
    return auth_headers(admin, RoleName.ADMIN)


@pytest.fixture
def hr_headers(db_session: Session, roles: dict[RoleName, Role]) -> dict[str, str]:
    """Bearer header for an HR manager."""
    staff = add_staff(
        db_session, roles[RoleName.HR_MANAGER], "priya.sharma@company.com", "HRM001"
    )
    return auth_headers(staff, RoleName.HR_MANAGER)


@pytest.fixture
def employee_headers(
    db_session: Session, roles: dict[RoleName, Role]
) -> dict[str, str]:
    """Bearer header for a regular employee."""
    staff = add_staff(
        db_session, roles[RoleName.EMPLOYEE], "amit.patel@company.com", "EMP001"
    )
    return auth_headers(staff, RoleName.EMPLOYEE)


def full_time_body(roles: dict[RoleName, Role]) -> dict[str, str | int]:
    """Build a valid full-time create body."""
    return {
        "employment_type": "FULL_TIME",
        "employee_code": "ENG001",
        "first_name": "Arjun",
        "last_name": "Mehta",
        "email": "arjun.mehta@company.com",
        "department": "Engineering",
        "job_title": "Backend Engineer",
        "hire_date": "2024-01-15T00:00:00Z",
        "role_id": roles[RoleName.EMPLOYEE].id,
        "password": "Secure@Pass1",
        "annual_salary": "85000.00",
    }


def contract_body(roles: dict[RoleName, Role]) -> dict[str, str | int]:
    """Build a valid contract create body."""
    return {
        "employment_type": "CONTRACT",
        "employee_code": "CON001",
        "first_name": "Rahul",
        "last_name": "Verma",
        "email": "rahul.verma@company.com",
        "department": "Design",
        "job_title": "UX Consultant",
        "hire_date": "2025-02-01T00:00:00Z",
        "role_id": roles[RoleName.EMPLOYEE].id,
        "password": "Secure@Pass1",
        "hourly_rate": "65.00",
        "contract_end_date": "2026-12-31T00:00:00Z",
    }


def create_employee(
    client: TestClient, headers: dict[str, str], body: dict[str, str | int]
) -> str:
    """Create an employee through the API and return its id."""
    response = client.post("/api/v1/employees", json=body, headers=headers)
    assert response.status_code == 201, response.text
    employee_id = response.json()["id"]
    assert isinstance(employee_id, str)
    return employee_id


def assert_error(response_json: dict[str, str], code: str) -> None:
    """Check the shared ErrorResponse shape."""
    assert set(response_json) == {"code", "message"}
    assert response_json["code"] == code
    assert "Traceback" not in response_json["message"]


class TestAnonymous:
    @pytest.mark.parametrize(
        ("method", "path"),
        [
            ("GET", "/api/v1/employees"),
            ("POST", "/api/v1/employees"),
            ("GET", f"/api/v1/employees/{MISSING_ID}"),
            ("PATCH", f"/api/v1/employees/{MISSING_ID}"),
            ("DELETE", f"/api/v1/employees/{MISSING_ID}"),
            ("GET", "/api/v1/employees/departments"),
            ("GET", "/api/v1/employees/stats"),
            ("GET", "/api/v1/roles"),
            ("POST", "/api/v1/auth/change-password"),
        ],
    )
    def test_requires_authentication(
        self, client: TestClient, method: str, path: str
    ) -> None:
        response = client.request(method, path, json={})

        assert response.status_code == 401
        assert_error(response.json(), "UNAUTHORIZED")


class TestAdmin:
    def test_full_lifecycle(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        roles: dict[RoleName, Role],
    ) -> None:
        employee_id = create_employee(client, admin_headers, full_time_body(roles))

        fetched = client.get(f"/api/v1/employees/{employee_id}", headers=admin_headers)
        assert fetched.status_code == 200
        assert fetched.json()["annual_salary"] == "85000.00"
        assert "password_hash" not in fetched.json()

        updated = client.patch(
            f"/api/v1/employees/{employee_id}",
            json={"job_title": "Senior Backend Engineer", "is_active": False},
            headers=admin_headers,
        )
        assert updated.status_code == 200
        assert updated.json()["job_title"] == "Senior Backend Engineer"
        assert updated.json()["is_active"] is False
        assert "password_hash" not in updated.json()

        deleted = client.delete(
            f"/api/v1/employees/{employee_id}", headers=admin_headers
        )
        assert deleted.status_code == 204
        assert deleted.content == b""

        after_delete = client.get(
            f"/api/v1/employees/{employee_id}", headers=admin_headers
        )
        assert after_delete.status_code == 404
        assert_error(after_delete.json(), "NOT_FOUND")

    def test_creates_contract_employee(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        roles: dict[RoleName, Role],
    ) -> None:
        employee_id = create_employee(client, admin_headers, contract_body(roles))

        fetched = client.get(f"/api/v1/employees/{employee_id}", headers=admin_headers)
        assert fetched.json()["employment_type"] == "CONTRACT"
        assert fetched.json()["hourly_rate"] == "65.00"

    def test_lists_with_filters(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        roles: dict[RoleName, Role],
    ) -> None:
        create_employee(client, admin_headers, full_time_body(roles))
        create_employee(client, admin_headers, contract_body(roles))

        response = client.get(
            "/api/v1/employees",
            params={"q": "verma", "department": "Design", "is_active": "true"},
            headers=admin_headers,
        )

        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 1
        assert body["items"][0]["email"] == "rahul.verma@company.com"
        assert all("password_hash" not in item for item in body["items"])

    def test_page_size_above_limit_is_rejected(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        response = client.get(
            "/api/v1/employees", params={"page_size": 101}, headers=admin_headers
        )

        assert response.status_code == 422
        assert_error(response.json(), "VALIDATION_ERROR")
        assert "page_size" in response.json()["message"]

    def test_lists_departments(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        roles: dict[RoleName, Role],
    ) -> None:
        create_employee(client, admin_headers, full_time_body(roles))

        response = client.get(
            "/api/v1/employees/departments", headers=admin_headers
        )

        assert response.json() == ["Engineering", "Human Resources"]

    def test_lists_roles(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        response = client.get("/api/v1/roles", headers=admin_headers)

        assert response.status_code == 200
        assert [role["name"] for role in response.json()] == [
            "ADMIN",
            "HR_MANAGER",
            "EMPLOYEE",
        ]

    def test_cannot_delete_self(
        self,
        client: TestClient,
        admin: FullTimeEmployee,
        admin_headers: dict[str, str],
    ) -> None:
        response = client.delete(
            f"/api/v1/employees/{admin.id}", headers=admin_headers
        )

        assert response.status_code == 403
        assert_error(response.json(), "SELF_ACTION_FORBIDDEN")

    def test_cannot_deactivate_self(
        self,
        client: TestClient,
        admin: FullTimeEmployee,
        admin_headers: dict[str, str],
    ) -> None:
        response = client.patch(
            f"/api/v1/employees/{admin.id}",
            json={"is_active": False},
            headers=admin_headers,
        )

        assert response.status_code == 403
        assert_error(response.json(), "SELF_ACTION_FORBIDDEN")

    @pytest.mark.parametrize("method", ["GET", "PATCH", "DELETE"])
    def test_missing_employee_returns_404(
        self, client: TestClient, admin_headers: dict[str, str], method: str
    ) -> None:
        response = client.request(
            method,
            f"/api/v1/employees/{MISSING_ID}",
            json={"job_title": "Analyst"},
            headers=admin_headers,
        )

        assert response.status_code == 404
        assert_error(response.json(), "NOT_FOUND")

    def test_duplicate_email_returns_409(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        roles: dict[RoleName, Role],
    ) -> None:
        create_employee(client, admin_headers, full_time_body(roles))
        duplicate = full_time_body(roles) | {"employee_code": "ENG002"}

        response = client.post(
            "/api/v1/employees", json=duplicate, headers=admin_headers
        )

        assert response.status_code == 409
        assert_error(response.json(), "DUPLICATE_EMAIL")

    def test_duplicate_code_returns_409(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        roles: dict[RoleName, Role],
    ) -> None:
        create_employee(client, admin_headers, full_time_body(roles))
        duplicate = full_time_body(roles) | {"email": "kavya.iyer@company.com"}

        response = client.post(
            "/api/v1/employees", json=duplicate, headers=admin_headers
        )

        assert response.status_code == 409
        assert_error(response.json(), "DUPLICATE_EMPLOYEE_CODE")

    def test_mismatched_pay_fields_return_422(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        roles: dict[RoleName, Role],
    ) -> None:
        body = full_time_body(roles) | {"hourly_rate": "40.00"}

        response = client.post("/api/v1/employees", json=body, headers=admin_headers)

        assert response.status_code == 422
        assert_error(response.json(), "VALIDATION_ERROR")

    def test_unknown_role_returns_422(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        roles: dict[RoleName, Role],
    ) -> None:
        body = full_time_body(roles) | {"role_id": 999}

        response = client.post("/api/v1/employees", json=body, headers=admin_headers)

        assert response.status_code == 422
        assert_error(response.json(), "INVALID_EMPLOYEE_DATA")


class TestEmployeeStats:
    def test_any_signed_in_role_can_read_stats(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        employee_headers: dict[str, str],
        roles: dict[RoleName, Role],
    ) -> None:
        create_employee(client, admin_headers, contract_body(roles))

        response = client.get("/api/v1/employees/stats", headers=employee_headers)

        assert response.status_code == 200
        body = response.json()
        assert (body["total"], body["active"], body["contract"]) == (3, 3, 1)
        assert body["by_department"][0] == {"department": "Human Resources", "count": 2}
        assert body["recent_hires"][0]["email"] == "rahul.verma@company.com"
        assert all("password_hash" not in hire for hire in body["recent_hires"])


class TestHrManager:
    def test_can_create_and_update(
        self,
        client: TestClient,
        hr_headers: dict[str, str],
        roles: dict[RoleName, Role],
    ) -> None:
        employee_id = create_employee(client, hr_headers, full_time_body(roles))

        response = client.patch(
            f"/api/v1/employees/{employee_id}",
            json={"department": "Platform"},
            headers=hr_headers,
        )

        assert response.status_code == 200

    def test_cannot_delete(
        self,
        client: TestClient,
        hr_headers: dict[str, str],
        admin_headers: dict[str, str],
        roles: dict[RoleName, Role],
    ) -> None:
        employee_id = create_employee(client, admin_headers, full_time_body(roles))

        response = client.delete(
            f"/api/v1/employees/{employee_id}", headers=hr_headers
        )

        assert response.status_code == 403
        assert_error(response.json(), "FORBIDDEN")

    def test_cannot_assign_admin_role(
        self,
        client: TestClient,
        hr_headers: dict[str, str],
        roles: dict[RoleName, Role],
    ) -> None:
        body = full_time_body(roles) | {"role_id": roles[RoleName.ADMIN].id}

        response = client.post("/api/v1/employees", json=body, headers=hr_headers)

        assert response.status_code == 403
        assert_error(response.json(), "FORBIDDEN")


class TestEmployeeRole:
    def test_can_read(
        self, client: TestClient, employee_headers: dict[str, str]
    ) -> None:
        response = client.get("/api/v1/employees", headers=employee_headers)

        assert response.status_code == 200

    def test_cannot_create(
        self,
        client: TestClient,
        employee_headers: dict[str, str],
        roles: dict[RoleName, Role],
    ) -> None:
        response = client.post(
            "/api/v1/employees", json=full_time_body(roles), headers=employee_headers
        )

        assert response.status_code == 403
        assert_error(response.json(), "FORBIDDEN")

    def test_cannot_update(
        self,
        client: TestClient,
        employee_headers: dict[str, str],
        admin: FullTimeEmployee,
    ) -> None:
        response = client.patch(
            f"/api/v1/employees/{admin.id}",
            json={"job_title": "Director"},
            headers=employee_headers,
        )

        assert response.status_code == 403

    def test_cannot_delete(
        self,
        client: TestClient,
        employee_headers: dict[str, str],
        admin: FullTimeEmployee,
    ) -> None:
        response = client.delete(
            f"/api/v1/employees/{admin.id}", headers=employee_headers
        )

        assert response.status_code == 403


class TestChangePassword:
    def test_changes_own_password_and_can_log_in(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        response = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": STAFF_PASSWORD, "new_password": "Fresh@Pass27"},
            headers=admin_headers,
        )
        assert response.status_code == 204

        login = client.post(
            "/api/v1/auth/login",
            json={"email": "neha.kapoor@company.com", "password": "Fresh@Pass27"},
        )
        assert login.status_code == 200

    def test_wrong_current_password_returns_422(
        self, client: TestClient, employee_headers: dict[str, str]
    ) -> None:
        response = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": "Wrong@Pass1", "new_password": "Fresh@Pass27"},
            headers=employee_headers,
        )

        assert response.status_code == 422
        assert_error(response.json(), "INVALID_EMPLOYEE_DATA")

    def test_short_new_password_returns_422(
        self, client: TestClient, employee_headers: dict[str, str]
    ) -> None:
        response = client.post(
            "/api/v1/auth/change-password",
            json={"current_password": STAFF_PASSWORD, "new_password": "short"},
            headers=employee_headers,
        )

        assert response.status_code == 422
        assert_error(response.json(), "VALIDATION_ERROR")


def test_unknown_route_uses_error_shape(client: TestClient) -> None:
    response = client.get("/api/v1/payroll")

    assert response.status_code == 404
    assert_error(response.json(), "NOT_FOUND")
