"""Role model for system roles."""

from datetime import UTC, datetime

from sqlalchemy import DateTime, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.primitives import Permission, RoleName
from app.models.access_permission import AccessPermission, role_permissions


class Role(Base):
    """System role; its permissions are granted through role_permissions."""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[RoleName] = mapped_column(
        SQLEnum(RoleName, native_enum=False, length=50),
        unique=True,
        nullable=False,
        index=True,
    )
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    permissions: Mapped[list[AccessPermission]] = relationship(
        secondary=role_permissions, lazy="selectin"
    )

    def permission_names(self) -> frozenset[Permission]:
        """Return the permissions this role currently grants."""
        return frozenset(permission.name for permission in self.permissions)
