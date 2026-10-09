"""FastAPI dependencies for authentication and authorization."""

from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import Argon2PasswordHasher, PasswordHasher
from app.core.tokens import JwtTokenService, TokenService
from app.domain.primitives import InvalidTokenError, Permission, RoleName
from app.models.employee import Employee
from app.repositories.employee import EmployeeRepository
from app.repositories.role import RoleRepository

security = HTTPBearer()


def get_employee_repository(
    db: Session = Depends(get_db),
) -> EmployeeRepository:
    """Dependency to get an EmployeeRepository instance."""
    return EmployeeRepository(db)


def get_role_repository(
    db: Session = Depends(get_db),
) -> RoleRepository:
    """Dependency to get a RoleRepository instance."""
    return RoleRepository(db)


def get_password_hasher() -> PasswordHasher:
    """Dependency to get a PasswordHasher instance."""
    return Argon2PasswordHasher()


def get_token_service() -> TokenService:
    """Dependency to get a TokenService instance."""
    return JwtTokenService()


def get_current_employee(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    employee_repo: EmployeeRepository = Depends(get_employee_repository),
    token_service: TokenService = Depends(get_token_service),
) -> Employee:
    """Dependency to get the current authenticated employee from Bearer token."""
    token = credentials.credentials

    try:
        claims = token_service.decode(token)
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        ) from e

    employee = employee_repo.get_by_id(claims.sub)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    return employee


def require_permission(
    required_permission: Permission,
) -> Callable[[Employee], Employee]:
    """Dependency factory to require a specific permission.

    Usage:
        @router.get(
            "/employees",
            dependencies=[Depends(require_permission(Permission.EMPLOYEE_READ))],
        )
    """

    def check_permission(
        employee: Employee = Depends(get_current_employee),
        role_repo: RoleRepository = Depends(get_role_repository),
    ) -> Employee:
        """Check if the employee has the required permission."""
        role = role_repo.get_by_id(employee.role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        from app.domain.primitives import AdminPolicy, EmployeePolicy, HrManagerPolicy

        policy_map: dict[RoleName, type] = {
            RoleName.ADMIN: AdminPolicy,
            RoleName.HR_MANAGER: HrManagerPolicy,
            RoleName.EMPLOYEE: EmployeePolicy,
        }

        policy_class = policy_map.get(role.name)
        if not policy_class:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        policy = policy_class()
        if required_permission not in policy.permissions():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        return employee

    return check_permission
