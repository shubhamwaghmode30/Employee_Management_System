"""Generic repository pattern for SQLAlchemy models."""

from abc import ABC, abstractmethod
from typing import TypeVar

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.core.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class AbstractRepository[ModelT](ABC):
    """Abstract base repository for data access operations."""

    @abstractmethod
    def add(self, model: ModelT) -> ModelT:
        """Add a model instance to the repository."""
        pass

    @abstractmethod
    def get_by_id(self, id: int | str) -> ModelT | None:
        """Retrieve a model instance by its primary key."""
        pass

    @abstractmethod
    def list(self) -> list[ModelT]:
        """List all model instances."""
        pass


class SqlAlchemyRepository(AbstractRepository[ModelT]):
    """SQLAlchemy implementation of the repository pattern."""

    def __init__(self, session: Session, model: type[ModelT]) -> None:
        """Initialize the repository with a session and model class."""
        self.session = session
        self.model = model

    def add(self, model: ModelT) -> ModelT:
        """Add a model instance to the session."""
        self.session.add(model)
        self.session.flush()
        self.session.refresh(model)
        return model

    def get_by_id(self, id: int | str) -> ModelT | None:
        """Retrieve a model instance by its primary key."""
        return self.session.get(self.model, id)

    def list(self) -> list[ModelT]:
        """List all model instances."""
        stmt = select(self.model)
        return list(self.session.scalars(stmt).all())

    def _base_query(self) -> Select[tuple[ModelT]]:
        """Build a base query for the model."""
        return select(self.model)
