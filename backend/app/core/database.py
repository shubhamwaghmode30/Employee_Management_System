"""Database engine, session factory, and declarative base.

SQLite is used for development. For AWS RDS PostgreSQL, set DATABASE_URL to a
PostgreSQL connection string and optionally add "psycopg[binary]" to
pyproject.toml dev extras for the psycopg driver.

Example PostgreSQL URL:
    postgresql+psycopg://USER:PASSWORD@HOST:5432/DBNAME
"""

from collections.abc import Generator
from contextlib import contextmanager

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.settings import get_settings


class Base(DeclarativeBase):
    """Typed declarative base for all ORM models.

    Inherits from SQLAlchemy 2.0 DeclarativeBase with Mapped[] support.
    """

    pass


def _create_engine() -> Engine:
    """Create a SQLAlchemy engine configured from settings.

    Applies SQLite-specific check_same_thread=False only for SQLite connections.
    PostgreSQL and other databases use default connection pooling.
    """
    settings = get_settings()
    database_url = settings.database_url

    if database_url.startswith("sqlite"):
        # SQLite requires check_same_thread=False for multi-threaded access
        return create_engine(database_url, connect_args={"check_same_thread": False})
    return create_engine(database_url)


engine = _create_engine()
SessionLocal = sessionmaker(bind=engine)


@contextmanager
def get_db() -> Generator[Session, None, None]:
    """Dependency-injectable database session.

    Yields a session and ensures it is closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
