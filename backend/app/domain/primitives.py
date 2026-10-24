"""Domain enums and domain exceptions.

Which role holds which permission lives in the role_permissions table.
"""

from enum import StrEnum


class EmploymentType(StrEnum):
    """Employment type discriminator for employee polymorphism."""

    FULL_TIME = "FULL_TIME"
    CONTRACT = "CONTRACT"


class RoleName(StrEnum):
    """System role names."""

    ADMIN = "ADMIN"
    HR_MANAGER = "HR_MANAGER"
    EMPLOYEE = "EMPLOYEE"


class Permission(StrEnum):
    """Granular permissions for role-based authorization."""

    EMPLOYEE_READ = "EMPLOYEE_READ"
    EMPLOYEE_CREATE = "EMPLOYEE_CREATE"
    EMPLOYEE_UPDATE = "EMPLOYEE_UPDATE"
    EMPLOYEE_DELETE = "EMPLOYEE_DELETE"
    EMPLOYEE_RESTORE = "EMPLOYEE_RESTORE"
    ROLE_ASSIGN = "ROLE_ASSIGN"


class EntityNotFoundError(Exception):
    """Raised when a requested entity does not exist."""

    def __init__(self, entity_type: str, identifier: str) -> None:
        self.entity_type = entity_type
        self.identifier = identifier
        super().__init__(f"{entity_type} with identifier '{identifier}' not found")


class DuplicateEmailError(Exception):
    """Raised when attempting to create an employee with an existing email."""

    def __init__(self, email: str) -> None:
        self.email = email
        super().__init__(f"Employee with email '{email}' already exists")


class DuplicateEmployeeCodeError(Exception):
    """Raised when attempting to create an employee with an existing code."""

    def __init__(self, employee_code: str) -> None:
        self.employee_code = employee_code
        super().__init__(f"Employee with code '{employee_code}' already exists")


class SelfActionError(Exception):
    """Raised when a user tries to delete or deactivate their own account."""

    def __init__(self, action: str) -> None:
        self.action = action
        super().__init__(f"You cannot {action} your own account")


class InvalidEmployeeDataError(Exception):
    """Raised when a request is well-formed but breaks an employee rule."""

    def __init__(self, message: str) -> None:
        super().__init__(message)


class AuthenticationError(Exception):
    """Raised when authentication fails (invalid credentials, inactive user, etc.)."""

    def __init__(self, message: str) -> None:
        super().__init__(message)


class AuthorizationError(Exception):
    """Raised when a user lacks permission for an action."""

    def __init__(self, required_permission: Permission) -> None:
        self.required_permission = required_permission
        super().__init__(f"Permission '{required_permission}' is required")


class InvalidTokenError(Exception):
    """Raised when a token is invalid, expired, or tampered with."""

    def __init__(self, reason: str) -> None:
        self.reason = reason
        super().__init__(f"Invalid token: {reason}")
