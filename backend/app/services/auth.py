"""Authentication service for login and token refresh."""

from app.core.security import PasswordHasher
from app.core.tokens import TokenService
from app.domain.primitives import InvalidTokenError
from app.repositories.employee import EmployeeRepository
from app.repositories.role import RoleRepository


class AuthService:
    """Service for authentication operations."""

    def __init__(
        self,
        employee_repo: EmployeeRepository,
        role_repo: RoleRepository,
        password_hasher: PasswordHasher,
        token_service: TokenService,
    ) -> None:
        """Initialize the auth service."""
        self.employee_repo = employee_repo
        self.role_repo = role_repo
        self.password_hasher = password_hasher
        self.token_service = token_service

    def login(self, email: str, password: str) -> tuple[str, str]:
        """Authenticate a user and return access and refresh tokens.

        Uses constant-time verification to prevent user enumeration.
        Rejects inactive and soft-deleted users.
        """
        employee = self.employee_repo.get_by_email(email)

        if not employee:
            self.password_hasher.hash("dummy-password")
            raise ValueError("Invalid email or password")

        if not employee.is_active or employee.deleted_at is not None:
            self.password_hasher.hash("dummy-password")
            raise ValueError("Invalid email or password")

        if not self.password_hasher.verify(password, employee.password_hash):
            raise ValueError("Invalid email or password")

        role = self.role_repo.get_by_id(employee.role_id)
        if not role:
            raise ValueError("Invalid user configuration")

        access_token = self.token_service.create_access_token(
            str(employee.id), role.name
        )
        refresh_token = self.token_service.create_refresh_token(
            str(employee.id), role.name
        )

        return access_token, refresh_token

    def refresh(self, refresh_token: str) -> str:
        """Issue a new access token from a refresh token."""
        try:
            claims = self.token_service.decode(refresh_token)
        except InvalidTokenError as e:
            raise ValueError("Invalid refresh token") from e

        if claims.type != "refresh":
            raise ValueError("Invalid refresh token")

        employee = self.employee_repo.get_by_id(claims.sub)
        if not employee or not employee.is_active or employee.deleted_at is not None:
            raise ValueError("Invalid refresh token")

        return self.token_service.create_access_token(claims.sub, claims.role)
