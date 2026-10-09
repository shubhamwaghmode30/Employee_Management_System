"""Tests for seed script idempotency."""

import os

from app.core.database import Base, SessionLocal, engine
from app.models.employee import Employee
from app.models.role import Role


def test_seed_idempotency() -> None:
    """Test that running seed twice creates no duplicates."""
    Base.metadata.create_all(engine)
    session = SessionLocal()

    try:
        os.environ["SEED_ADMIN_EMAIL"] = "admin@seed.test"
        os.environ["SEED_ADMIN_PASSWORD"] = "seed-password-123"
        os.environ["SEED_SAMPLE_PASSWORD"] = "sample-password-123"

        from scripts.seed import seed_admin, seed_roles, seed_sample_employees

        seed_roles(session)
        seed_admin(session)
        seed_sample_employees(session)

        role_count_before = session.query(Role).count()
        employee_count_before = session.query(Employee).count()

        seed_roles(session)
        seed_admin(session)
        seed_sample_employees(session)

        role_count_after = session.query(Role).count()
        employee_count_after = session.query(Employee).count()

        assert role_count_before == role_count_after
        assert employee_count_before == employee_count_after
        assert role_count_after == 3
        assert employee_count_after == 5

    finally:
        session.rollback()
        session.close()
