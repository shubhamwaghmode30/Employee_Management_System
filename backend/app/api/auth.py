"""Authentication routes for login, refresh, and current user."""

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.dependencies import (
    get_current_employee,
    get_employee_repository,
    get_password_hasher,
    get_role_repository,
    get_token_service,
)
from app.api.employee import get_employee_service
from app.core.security import PasswordHasher
from app.core.tokens import TokenService
from app.domain.primitives import AuthenticationError, InvalidTokenError
from app.models.employee import Employee
from app.repositories.employee import EmployeeRepository
from app.repositories.role import RoleRepository
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    LoginResponse,
    PasswordChange,
    RefreshTokenRequest,
    RefreshTokenResponse,
)
from app.services.auth import AuthService
from app.services.employee import EmployeeService

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

    permissions = sorted(permission.value for permission in role.permission_names())

    return CurrentUserResponse(
        id=str(current_employee.id),
        email=current_employee.email,
        first_name=current_employee.first_name,
        last_name=current_employee.last_name,
        role=role.name,
        permissions=permissions,
    )


@auth_router.post(
    "/change-password",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def change_password(
    data: PasswordChange,
    current_employee: Employee = Depends(get_current_employee),
    employee_service: EmployeeService = Depends(get_employee_service),
) -> Response:
    """Change the signed-in employee's own password."""
    employee_service.change_password(
        current_employee, data.current_password, data.new_password
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
