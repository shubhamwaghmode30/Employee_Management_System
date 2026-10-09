"""Tests for JWT token service."""

from datetime import timedelta

import pytest

from app.core.tokens import InvalidTokenError, JwtTokenService


class TestJwtTokenService:
    """Tests for JwtTokenService."""

    def test_create_access_token(self) -> None:
        """Test creating an access token."""
        service = JwtTokenService()
        token = service.create_access_token("emp123", "ADMIN")
        assert token
        assert isinstance(token, str)

    def test_decode_valid_token(self) -> None:
        """Test decoding a valid token."""
        service = JwtTokenService()
        token = service.create_access_token("emp123", "ADMIN")
        claims = service.decode(token)
        assert claims.sub == "emp123"
        assert claims.role == "ADMIN"
        assert claims.type == "access"

    def test_decode_expired_token_raises_error(self) -> None:
        """Test that decoding an expired token raises InvalidTokenError."""
        service = JwtTokenService()
        token = service.create_access_token(
            "emp123", "ADMIN", expires_delta=timedelta(seconds=-1)
        )
        with pytest.raises(InvalidTokenError, match="expired"):
            service.decode(token)

    def test_decode_tampered_token_raises_error(self) -> None:
        """Test that decoding a tampered token raises InvalidTokenError."""
        service = JwtTokenService()
        token = service.create_access_token("emp123", "ADMIN")
        tampered = token[:-5] + "abcde"
        with pytest.raises(InvalidTokenError):
            service.decode(tampered)

    def test_refresh_token_has_longer_expiration(self) -> None:
        """Test that refresh tokens have longer expiration than access tokens."""
        service = JwtTokenService()
        access_token = service.create_access_token("emp123", "ADMIN")
        refresh_token = service.create_refresh_token("emp123", "ADMIN")

        access_claims = service.decode(access_token)
        refresh_claims = service.decode(refresh_token)

        assert refresh_claims.exp > access_claims.exp
        assert refresh_claims.type == "refresh"
