"""Shared fixtures for the reference data the migrations create."""

import pytest
from sqlalchemy.orm import Session

from app.domain.primitives import Permission, RoleName
from app.models.access_permission import AccessPermission
from app.models.role import Role

# Mirrors the grants inserted by the c41e7b2d9f10 migration.
DEFAULT_GRANTS: dict[RoleName, frozenset[Permission]] = {
    RoleName.ADMIN: frozenset(Permission),
    RoleName.HR_MANAGER: frozenset(
        {
            Permission.EMPLOYEE_READ,
            Permission.EMPLOYEE_CREATE,
            Permission.EMPLOYEE_UPDATE,
        }
    ),
    RoleName.EMPLOYEE: frozenset({Permission.EMPLOYEE_READ}),
}


@pytest.fixture
def default_roles(db_session: Session) -> dict[RoleName, Role]:
    """Create the system roles with their default permission grants."""
    permissions = {
        permission: AccessPermission(
            name=permission, description=permission.value.replace("_", " ").lower()
        )
        for permission in Permission
    }
    roles = {
        role_name: Role(
            name=role_name,
            description=role_name.value.replace("_", " ").title(),
            permissions=[permissions[permission] for permission in sorted(grants)],
        )
        for role_name, grants in DEFAULT_GRANTS.items()
    }
    db_session.add_all(roles.values())
    db_session.commit()
    return roles
