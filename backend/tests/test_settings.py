"""Tests for environment-driven settings."""

from pathlib import Path

from app.core.settings import Settings


def test_seed_variables_in_env_file_do_not_break_settings(tmp_path: Path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text(
        "APP_ENV=dev\n"
        "SEED_ADMIN_EMAIL=neha.kapoor@company.com\n"
        "SEED_ADMIN_PASSWORD=Admin@12345\n",
        encoding="utf-8",
    )

    settings = Settings(_env_file=env_file)

    assert settings.app_env == "dev"
