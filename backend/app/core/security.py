"""Password hashing abstraction and Argon2 implementation."""

from abc import ABC, abstractmethod

from argon2 import PasswordHasher as Argon2Hasher
from argon2.exceptions import VerifyMismatchError


class PasswordHasher(ABC):
    """Abstract base for password hashing strategies."""

    @abstractmethod
    def hash(self, password: str) -> str:
        """Hash a password for storage."""
        raise NotImplementedError

    @abstractmethod
    def verify(self, password: str, hash: str) -> bool:
        """Verify a password against a stored hash."""
        raise NotImplementedError

    @abstractmethod
    def needs_rehash(self, hash: str) -> bool:
        """Check if a hash needs to be rehashed with new parameters."""
        raise NotImplementedError


class Argon2PasswordHasher(PasswordHasher):
    """Argon2id password hasher with secure defaults."""

    def __init__(self) -> None:
        """Initialize with Argon2id defaults."""
        self._hasher = Argon2Hasher(
            time_cost=3,
            memory_cost=64 * 1024,
            parallelism=4,
            hash_len=32,
            salt_len=16,
        )

    def hash(self, password: str) -> str:
        """Hash a password using Argon2id."""
        return self._hasher.hash(password)

    def verify(self, password: str, hash: str) -> bool:
        """Verify a password against an Argon2id hash."""
        try:
            self._hasher.verify(hash, password)
            return True
        except VerifyMismatchError:
            return False

    def needs_rehash(self, hash: str) -> bool:
        """Check if the hash needs rehashing with current parameters."""
        return self._hasher.check_needs_rehash(hash)
