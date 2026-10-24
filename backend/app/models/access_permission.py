"""Permission catalogue and the role-to-permission grant table."""

from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.domain.primitives import Permission

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column(
        "role_id",
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "permission_name",
        ForeignKey("permissions.name", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class AccessPermission(Base):
    """A permission that can be granted to roles.

    Rows are reference data created by migrations, so grants can change in the
    database without a code release.
    """

    __tablename__ = "permissions"

    name: Mapped[Permission] = mapped_column(
        SQLEnum(Permission, native_enum=False, length=50),
        primary_key=True,
    )
    description: Mapped[str] = mapped_column(String(255), nullable=False)
