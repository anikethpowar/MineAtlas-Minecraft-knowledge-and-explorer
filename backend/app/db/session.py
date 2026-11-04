"""Database engine and session management for MineAtlas."""

from collections.abc import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import DATABASE_URL


def configure_sqlite_foreign_keys(target_engine: Engine) -> None:
    """Register connection event to enforce SQLite foreign keys."""
    @event.listens_for(target_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):  # pylint: disable=unused-argument
        # Only execute PRAGMA on sqlite connections
        if target_engine.dialect.name == "sqlite":
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON;")
            cursor.close()


def create_app_engine(url: str | None = None) -> Engine:
    """Create a configured SQLAlchemy engine."""
    db_url = url or DATABASE_URL
    is_sqlite = db_url.startswith("sqlite")

    engine_kwargs = {}
    if is_sqlite:
        # check_same_thread=False allows FastAPI multi-threaded request handling with SQLite
        engine_kwargs["connect_args"] = {"check_same_thread": False}

    eng = create_engine(db_url, echo=False, **engine_kwargs)

    if is_sqlite:
        configure_sqlite_foreign_keys(eng)

    return eng


# Global application engine and session factory
engine = create_app_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

