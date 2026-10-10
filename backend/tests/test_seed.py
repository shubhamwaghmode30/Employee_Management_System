"""Tests for seed script idempotency."""

from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.models.employee import Employee
from app.models.role import Role
from scripts.seed import seed_admin, seed_roles, seed_sample_employees


@pytest.fixture
def session() -> Generator[Session, None, None]:
    """Use an in-memory database so seeding never touches the dev database."""
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)
    db_session = sessionmaker(bind=engine)()
    try:
        yield db_session
    finally:
        db_session.close()
        Base.metadata.drop_all(engine)


def test_seed_idempotency(session: Session, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that running seed twice creates no duplicates."""
    monkeypatch.setenv("SEED_ADMIN_EMAIL", "neha.kapoor@company.com")
    monkeypatch.setenv("SEED_ADMIN_PASSWORD", "Admin@Seed2026")
    monkeypatch.setenv("SEED_SAMPLE_PASSWORD", "Sample@Seed2026")

    seed_roles(session)
    seed_admin(session)
    seed_sample_employees(session)

    role_count_before = session.query(Role).count()
    employee_count_before = session.query(Employee).count()

    seed_roles(session)
    seed_admin(session)
    seed_sample_employees(session)

    assert session.query(Role).count() == role_count_before == 3
    assert session.query(Employee).count() == employee_count_before == 5
