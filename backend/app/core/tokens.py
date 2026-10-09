"""JWT token service abstraction and PyJWT implementation."""

import os
from abc import ABC, abstractmethod
from datetime import UTC, datetime, timedelta

import jwt
from pydantic import BaseModel, Field, ValidationError

from app.core.settings import get_settings
from app.domain.primitives import InvalidTokenError


class TokenClaims(BaseModel):
    """JWT token claims model."""

    sub: str = Field(..., description="Employee ID")
    role: str = Field(..., description="Employee role name")
    exp: datetime = Field(..., description="Expiration time")
    iat: datetime = Field(..., description="Issued at time")
    jti: str = Field(..., description="Token ID")
    type: str = Field(..., description="Token type (access or refresh)")


class TokenService(ABC):
    """Abstract base for token generation and validation."""

    @abstractmethod
    def create_access_token(
        self, employee_id: str, role: str, expires_delta: timedelta | None = None
    ) -> str:
        """Create an access token."""
        raise NotImplementedError

    @abstractmethod
    def create_refresh_token(
        self, employee_id: str, role: str, expires_delta: timedelta | None = None
    ) -> str:
        """Create a refresh token."""
        raise NotImplementedError

    @abstractmethod
    def decode(self, token: str) -> TokenClaims:
        """Decode and validate a token."""
        raise NotImplementedError


class JwtTokenService(TokenService):
    """PyJWT-based token service."""

    def __init__(self) -> None:
        """Initialize with settings and validate JWT_SECRET."""
        settings = get_settings()
        self.secret = settings.jwt_secret
        self.algorithm = settings.jwt_algorithm

        if settings.app_env != "dev":
            weak_secrets = [
                "",
                "replace-with-a-long-random-secret",
                "dev-secret",
                "test",
            ]
            if self.secret in weak_secrets or len(self.secret) < 32:
                raise ValueError(
                    "JWT_SECRET must be a long random value in non-dev environments"
                )

    def _get_expiration(self, expires_delta: timedelta | None) -> datetime:
        """Calculate expiration time."""
        if expires_delta:
            return datetime.now(UTC) + expires_delta
        return datetime.now(UTC) + timedelta(
            minutes=get_settings().access_token_expire_minutes
        )

    def _generate_jti(self) -> str:
        """Generate a unique token ID."""
        return os.urandom(16).hex()

    def create_access_token(
        self, employee_id: str, role: str, expires_delta: timedelta | None = None
    ) -> str:
        """Create an access token."""
        now = datetime.now(UTC)
        exp = self._get_expiration(expires_delta)
        jti = self._generate_jti()

        payload = {
            "sub": employee_id,
            "role": role,
            "exp": exp,
            "iat": now,
            "jti": jti,
            "type": "access",
        }

        return jwt.encode(payload, self.secret, algorithm=self.algorithm)

    def create_refresh_token(
        self, employee_id: str, role: str, expires_delta: timedelta | None = None
    ) -> str:
        """Create a refresh token with longer expiration."""
        now = datetime.now(UTC)
        exp = self._get_expiration(expires_delta or timedelta(days=7))
        jti = self._generate_jti()

        payload = {
            "sub": employee_id,
            "role": role,
            "exp": exp,
            "iat": now,
            "jti": jti,
            "type": "refresh",
        }

        return jwt.encode(payload, self.secret, algorithm=self.algorithm)

    def decode(self, token: str) -> TokenClaims:
        """Decode and validate a token."""
        try:
            payload = jwt.decode(
                token,
                self.secret,
                algorithms=[self.algorithm],
                options={"require": ["exp", "iat", "jti", "type"]},
            )
            return TokenClaims.model_validate(payload)
        except jwt.ExpiredSignatureError as e:
            raise InvalidTokenError("Token has expired") from e
        except jwt.InvalidTokenError as e:
            raise InvalidTokenError("Invalid token") from e
        except ValidationError as e:
            raise InvalidTokenError("Invalid token claims") from e
