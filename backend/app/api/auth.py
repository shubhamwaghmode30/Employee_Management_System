"""Authentication routes for login, refresh, and current user."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import (
    get_current_employee,
    get_employee_repository,
    get_password_hasher,
    get_role_repository,
    get_token_service,
)
from app.core.security import PasswordHasher
from app.core.tokens import TokenService
from app.domain.primitives import AuthenticationError, InvalidTokenError, RoleName
from app.models.employee import Employee
from app.repositories.employee import EmployeeRepository
from app.repositories.role import RoleRepository
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
)
from app.services.auth import AuthService

auth_router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(
    employee_repo: EmployeeRepository = Depends(get_employee_repository),
    role_repo: RoleRepository = Depends(get_role_repository),
    password_hasher: PasswordHasher = Depends(get_password_hasher),
    token_service: TokenService = Depends(get_token_service),
) -> AuthService:
    """Dependency to get AuthService instance."""
    return AuthService(employee_repo, role_repo, password_hasher, token_service)


@auth_router.post("/login", response_model=LoginResponse)
def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> LoginResponse:
    """Authenticate user and return access and refresh tokens."""
    try:
        access_token, refresh_token = auth_service.login(
            request.email, request.password
        )
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e


@auth_router.post("/refresh", response_model=RefreshTokenResponse)
def refresh(
    request: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> RefreshTokenResponse:
    """Refresh access token using a refresh token."""
    try:
        access_token = auth_service.refresh(request.refresh_token)
        return RefreshTokenResponse(access_token=access_token, token_type="bearer")
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        ) from e


@auth_router.get("/me", response_model=CurrentUserResponse)
def get_current_user(
    current_employee: Employee = Depends(get_current_employee),
    role_repo: RoleRepository = Depends(get_role_repository),
) -> CurrentUserResponse:
    """Get current authenticated user information."""
    role = role_repo.get_by_id(current_employee.role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid user configuration",
        )

    from app.domain.primitives import (
        AdminPolicy,
        EmployeePolicy,
        HrManagerPolicy,
    )

    policy_map: dict[RoleName, type] = {
        RoleName.ADMIN: AdminPolicy,
        RoleName.HR_MANAGER: HrManagerPolicy,
        RoleName.EMPLOYEE: EmployeePolicy,
    }

    policy_class = policy_map.get(role.name)
    if not policy_class:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid user configuration",
        )

    policy = policy_class()
    permissions = sorted(p.name for p in policy.permissions())

    return CurrentUserResponse(
        id=str(current_employee.id),
        email=current_employee.email,
        first_name=current_employee.first_name,
        last_name=current_employee.last_name,
        role=role.name,
        permissions=permissions,
    )
