"""Role model for system roles."""

from datetime import UTC, datetime

from sqlalchemy import DateTime, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.domain.primitives import RoleName


class Role(Base):
    """System role with permissions."""

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
