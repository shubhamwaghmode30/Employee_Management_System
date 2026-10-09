"""Repository for Role model operations."""

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
        return self.session.scalars(stmt).first()

    def get_by_id(self, id: int | str) -> Role | None:
        """Retrieve a role by ID."""
        return self.session.get(Role, id)
