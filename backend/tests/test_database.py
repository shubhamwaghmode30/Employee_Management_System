"""Tests for the request-scoped database session dependency."""

from collections.abc import Generator

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core import database
from app.core.database import Base, get_db
from app.domain.primitives import RoleName
from app.models.role import Role


@pytest.fixture
def session_factory(
    monkeypatch: pytest.MonkeyPatch,
) -> Generator[sessionmaker[Session], None, None]:
    """Point get_db at an in-memory database shared across sessions."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    monkeypatch.setattr(database, "SessionLocal", factory)
    yield factory
    Base.metadata.drop_all(engine)


def count_roles(factory: sessionmaker[Session]) -> int:
    """Count roles from a fresh session, outside the request transaction."""
    with factory() as session:
        return int(session.scalar(select(func.count()).select_from(Role)) or 0)


def test_get_db_commits_when_request_succeeds(
    session_factory: sessionmaker[Session],
) -> None:
    dependency = get_db()
    session = next(dependency)
    session.add(Role(name=RoleName.HR_MANAGER, description="HR Manager"))
    session.flush()

    with pytest.raises(StopIteration):
        next(dependency)

    assert count_roles(session_factory) == 1


def test_get_db_rolls_back_when_request_fails(
    session_factory: sessionmaker[Session],
) -> None:
    dependency = get_db()
    session = next(dependency)
    session.add(Role(name=RoleName.HR_MANAGER, description="HR Manager"))
    session.flush()

    with pytest.raises(RuntimeError):
        dependency.throw(RuntimeError("handler failed"))

    assert count_roles(session_factory) == 0
