"""Tests for seed script idempotency."""

from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.domain.primitives import RoleName
from app.models.employee import Employee
from app.models.role import Role
from scripts.seed import seed_admin, seed_sample_employees


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Use an in-memory database so seeding never touches the dev database."""
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


def test_seed_idempotency(
    db_session: Session,
    default_roles: dict[RoleName, Role],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that running seed twice creates no duplicates."""
    monkeypatch.setenv("SEED_ADMIN_EMAIL", "neha.kapoor@company.com")
    monkeypatch.setenv("SEED_ADMIN_PASSWORD", "Admin@Seed2026")
    monkeypatch.setenv("SEED_SAMPLE_PASSWORD", "Sample@Seed2026")

    seed_admin(db_session)
    seed_sample_employees(db_session)
    employee_count_before = db_session.query(Employee).count()

    seed_admin(db_session)
    seed_sample_employees(db_session)

    assert db_session.query(Employee).count() == employee_count_before == 5


def test_seed_admin_requires_migrated_roles(
    db_session: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Roles come from migrations, so seeding an unmigrated database fails."""
    monkeypatch.setenv("SEED_ADMIN_EMAIL", "neha.kapoor@company.com")
    monkeypatch.setenv("SEED_ADMIN_PASSWORD", "Admin@Seed2026")

    with pytest.raises(ValueError, match="alembic upgrade head"):
        seed_admin(db_session)
