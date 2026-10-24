"""Tests that migrations create the RBAC reference data."""

from collections.abc import Generator
from pathlib import Path

import pytest
from alembic.config import Config
from sqlalchemy import Connection, create_engine, text
from sqlalchemy.exc import IntegrityError

from alembic import command
from app.core.settings import get_settings

BACKEND_DIR = Path(__file__).resolve().parent.parent


@pytest.fixture
def migrated_database_url(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> Generator[str, None, None]:
    """Upgrade a throwaway SQLite file to head and return its URL."""
    database_url = f"sqlite:///{(tmp_path / 'migrated.db').as_posix()}"
    monkeypatch.setenv("DATABASE_URL", database_url)
    get_settings.cache_clear()
    command.upgrade(alembic_config(), "head")
    yield database_url
    get_settings.cache_clear()


def alembic_config() -> Config:
    """Load the project's Alembic configuration."""
    return Config(str(BACKEND_DIR / "alembic.ini"))


def test_upgrade_grants_default_permissions(migrated_database_url: str) -> None:
    """Each role holds exactly the permissions of the documented matrix."""
    engine = create_engine(migrated_database_url)
    with engine.connect() as connection:
        rows = connection.execute(
            text(
                "SELECT roles.name, role_permissions.permission_name "
                "FROM role_permissions "
                "JOIN roles ON roles.id = role_permissions.role_id"
            )
        ).all()
    engine.dispose()

    grants: dict[str, set[str]] = {}
    for role_name, permission_name in rows:
        grants.setdefault(role_name, set()).add(permission_name)

    assert grants["EMPLOYEE"] == {"EMPLOYEE_READ"}
    assert grants["HR_MANAGER"] == {
        "EMPLOYEE_READ",
        "EMPLOYEE_CREATE",
        "EMPLOYEE_UPDATE",
    }
    assert grants["ADMIN"] == {
        "EMPLOYEE_READ",
        "EMPLOYEE_CREATE",
        "EMPLOYEE_UPDATE",
        "EMPLOYEE_DELETE",
        "EMPLOYEE_RESTORE",
        "ROLE_ASSIGN",
    }


def insert_employee(
    connection: Connection, employee_id: str, deleted_at: str | None
) -> None:
    """Insert a minimal employee row using the migrated schema."""
    connection.execute(
        text(
            "INSERT INTO employees (id, employee_code, first_name, last_name, "
            "email, password_hash, department, job_title, hire_date, is_active, "
            "role_id, employment_type, created_at, updated_at, deleted_at) "
            "SELECT :id, 'ENG001', 'Arjun', 'Mehta', 'arjun.mehta@company.com', "
            "'argon2-hash', 'Engineering', 'Backend Engineer', CURRENT_TIMESTAMP, "
            "1, roles.id, 'FULL_TIME', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "
            ":deleted_at FROM roles WHERE roles.name = 'EMPLOYEE'"
        ),
        {"id": employee_id, "deleted_at": deleted_at},
    )


def test_email_is_unique_among_live_rows_only(migrated_database_url: str) -> None:
    """A soft-deleted row frees its email; two live rows still clash."""
    engine = create_engine(migrated_database_url)
    with engine.begin() as connection:
        insert_employee(
            connection, "3f1c2a8e-0000-4000-8000-000000000001", "2026-09-30"
        )
        insert_employee(connection, "3f1c2a8e-0000-4000-8000-000000000002", None)
    with pytest.raises(IntegrityError), engine.begin() as connection:
        insert_employee(connection, "3f1c2a8e-0000-4000-8000-000000000003", None)
    engine.dispose()


def test_downgrade_to_base_succeeds(migrated_database_url: str) -> None:
    """Every migration can be rolled back on an empty database."""
    command.downgrade(alembic_config(), "base")

    engine = create_engine(migrated_database_url)
    with engine.connect() as connection:
        tables = connection.execute(
            text("SELECT name FROM sqlite_master WHERE type = 'table'")
        ).scalars().all()
    engine.dispose()
    assert set(tables) <= {"alembic_version"}
