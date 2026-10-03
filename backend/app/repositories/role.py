"""Repository for Role model operations."""

from typing import cast

from sqlalchemy.orm import Session

from app.domain.primitives import RoleName
from app.models.role import Role
from app.repositories.base import SqlAlchemyRepository


class RoleRepository(SqlAlchemyRepository[Role]):
    """Repository for Role model with custom queries."""

    def __init__(self, session: Session) -> None:
        """Initialize the role repository."""
        super().__init__(session, Role)

    def get_by_name(self, name: RoleName) -> Role | None:
        """Retrieve a role by its name."""
        stmt = self._base_query().where(Role.name == name)
        result = self.session.scalars(stmt).first()
        return cast(Role | None, result)
