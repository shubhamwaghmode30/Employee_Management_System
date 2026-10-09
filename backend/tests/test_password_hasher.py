"""Tests for password hashing abstraction."""

from app.core.security import Argon2PasswordHasher


class TestArgon2PasswordHasher:
    """Tests for Argon2PasswordHasher."""

    def test_hash_round_trip(self) -> None:
        """Test that hashing and verifying a password works."""
        hasher = Argon2PasswordHasher()
        test_password = "secure-password-123"
        hash = hasher.hash(test_password)
        assert hasher.verify(test_password, hash) is True

    def test_verify_wrong_password(self) -> None:
        """Test that verifying with wrong password returns False."""
        hasher = Argon2PasswordHasher()
        test_password = "secure-password-123"
        hash = hasher.hash(test_password)
        assert hasher.verify("wrong-password", hash) is False

    def test_hash_is_different_each_time(self) -> None:
        """Test that hashing the same password produces different hashes (salt)."""
        hasher = Argon2PasswordHasher()
        test_password = "secure-password-123"
        hash1 = hasher.hash(test_password)
        hash2 = hasher.hash(test_password)
        assert hash1 != hash2
        assert hasher.verify(test_password, hash1) is True
        assert hasher.verify(test_password, hash2) is True

    def test_needs_rehash_fresh_hash(self) -> None:
        """Test that a fresh hash does not need rehashing."""
        hasher = Argon2PasswordHasher()
        test_password = "secure-password-123"
        hash = hasher.hash(test_password)
        assert hasher.needs_rehash(hash) is False
