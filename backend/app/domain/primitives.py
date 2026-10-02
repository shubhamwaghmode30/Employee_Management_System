"""Domain enums, role policies, and domain exceptions."""

from abc import ABC, abstractmethod
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
    ROLE_ASSIGN = "ROLE_ASSIGN"


class RolePolicy(ABC):
    """Abstract base for role-based permission policies."""

    @abstractmethod
    def permissions(self) -> frozenset[Permission]:
        """Return the set of permissions granted by this role."""
        raise NotImplementedError


class AdminPolicy(RolePolicy):
    """Admin role has all permissions."""

    def permissions(self) -> frozenset[Permission]:
        return frozenset(
            {
                Permission.EMPLOYEE_READ,
                Permission.EMPLOYEE_CREATE,
                Permission.EMPLOYEE_UPDATE,
                Permission.EMPLOYEE_DELETE,
                Permission.ROLE_ASSIGN,
            }
        )


class HrManagerPolicy(RolePolicy):
    """HR Manager can read, create, and update employees."""

    def permissions(self) -> frozenset[Permission]:
        return frozenset(
            {
                Permission.EMPLOYEE_READ,
                Permission.EMPLOYEE_CREATE,
                Permission.EMPLOYEE_UPDATE,
            }
        )


class EmployeePolicy(RolePolicy):
    """Employee role has read-only access."""

    def permissions(self) -> frozenset[Permission]:
        return frozenset({Permission.EMPLOYEE_READ})


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


class AuthorizationError(Exception):
    """Raised when a user lacks permission for an action."""

    def __init__(self, required_permission: Permission) -> None:
        self.required_permission = required_permission
        super().__init__(f"Permission '{required_permission}' is required")
