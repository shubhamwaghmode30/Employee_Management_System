import json
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Process configuration loaded from environment variables and optional .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="forbid",
        frozen=True,
        populate_by_name=True,
    )

    app_env: str = Field(default="dev", alias="APP_ENV")
    database_url: str = Field(
        default="sqlite:///./employee_management_dev.db",
        alias="DATABASE_URL",
    )
    jwt_secret: str = Field(
        default="replace-with-a-long-random-secret",
        alias="JWT_SECRET",
    )
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=30,
        alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )
    cors_origins: tuple[str, ...] = Field(
        default=("http://localhost:8081", "http://127.0.0.1:8081"),
        alias="CORS_ORIGINS",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(
        cls,
        value: str | tuple[str, ...] | list[str],
    ) -> tuple[str, ...]:
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                parsed_json = json.loads(stripped)
                if not isinstance(parsed_json, list):
                    raise ValueError(
                        "CORS_ORIGINS JSON must be an array of origin strings",
                    )
                origins: list[str] = []
                for origin in parsed_json:
                    if not isinstance(origin, str):
                        raise ValueError("each CORS origin must be a string")
                    origins.append(origin)
                return tuple(origins)
            return tuple(
                origin.strip() for origin in stripped.split(",") if origin.strip()
            )
        if isinstance(value, list):
            return tuple(value)
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
