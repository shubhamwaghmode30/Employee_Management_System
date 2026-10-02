"""Unit tests for domain primitives."""

from app.domain.primitives import (
    AdminPolicy,
    AuthorizationError,
    DuplicateEmailError,
    EmployeePolicy,
    EmploymentType,
    EntityNotFoundError,
    HrManagerPolicy,
    Permission,
    RoleName,
)


class TestEmploymentType:
    def test_full_time_value(self) -> None:
        assert EmploymentType.FULL_TIME == "FULL_TIME"

    def test_contract_value(self) -> None:
        assert EmploymentType.CONTRACT == "CONTRACT"


class TestRoleName:
    def test_admin_value(self) -> None:
        assert RoleName.ADMIN == "ADMIN"

    def test_hr_manager_value(self) -> None:
        assert RoleName.HR_MANAGER == "HR_MANAGER"

    def test_employee_value(self) -> None:
        assert RoleName.EMPLOYEE == "EMPLOYEE"


class TestPermission:
    def test_employee_read_value(self) -> None:
        assert Permission.EMPLOYEE_READ == "EMPLOYEE_READ"

    def test_employee_create_value(self) -> None:
        assert Permission.EMPLOYEE_CREATE == "EMPLOYEE_CREATE"

    def test_employee_update_value(self) -> None:
        assert Permission.EMPLOYEE_UPDATE == "EMPLOYEE_UPDATE"

    def test_employee_delete_value(self) -> None:
        assert Permission.EMPLOYEE_DELETE == "EMPLOYEE_DELETE"

    def test_role_assign_value(self) -> None:
        assert Permission.ROLE_ASSIGN == "ROLE_ASSIGN"


class TestAdminPolicy:
    def test_has_all_permissions(self) -> None:
        policy = AdminPolicy()
        permissions = policy.permissions()
        assert Permission.EMPLOYEE_READ in permissions
        assert Permission.EMPLOYEE_CREATE in permissions
        assert Permission.EMPLOYEE_UPDATE in permissions
        assert Permission.EMPLOYEE_DELETE in permissions
        assert Permission.ROLE_ASSIGN in permissions
        assert len(permissions) == 5


class TestHrManagerPolicy:
    def test_has_read_create_update_permissions(self) -> None:
        policy = HrManagerPolicy()
        permissions = policy.permissions()
        assert Permission.EMPLOYEE_READ in permissions
        assert Permission.EMPLOYEE_CREATE in permissions
        assert Permission.EMPLOYEE_UPDATE in permissions
        assert Permission.EMPLOYEE_DELETE not in permissions
        assert Permission.ROLE_ASSIGN not in permissions
        assert len(permissions) == 3


class TestEmployeePolicy:
    def test_has_read_only_permission(self) -> None:
        policy = EmployeePolicy()
        permissions = policy.permissions()
        assert Permission.EMPLOYEE_READ in permissions
        assert Permission.EMPLOYEE_CREATE not in permissions
        assert Permission.EMPLOYEE_UPDATE not in permissions
        assert Permission.EMPLOYEE_DELETE not in permissions
        assert Permission.ROLE_ASSIGN not in permissions
        assert len(permissions) == 1


class TestEntityNotFoundError:
    def test_message_format(self) -> None:
        error = EntityNotFoundError("Employee", "123")
        assert str(error) == "Employee with identifier '123' not found"
        assert error.entity_type == "Employee"
        assert error.identifier == "123"


class TestDuplicateEmailError:
    def test_message_format(self) -> None:
        error = DuplicateEmailError("test@example.com")
        assert str(error) == "Employee with email 'test@example.com' already exists"
        assert error.email == "test@example.com"


class TestAuthorizationError:
    def test_message_format(self) -> None:
        error = AuthorizationError(Permission.EMPLOYEE_DELETE)
        assert str(error) == "Permission 'EMPLOYEE_DELETE' is required"
        assert error.required_permission == Permission.EMPLOYEE_DELETE
