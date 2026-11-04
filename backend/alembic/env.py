"""Alembic environment configuration for MineAtlas."""

import os
from logging.config import fileConfig
from pathlib import Path
import sys

from alembic import context
from sqlalchemy import create_engine, pool

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.config import DATABASE_URL
from app.db.models import Base
from app.db.session import configure_sqlite_foreign_keys

# Interpret the config file for Python logging.
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set model metadata for autogenerate support
target_metadata = Base.metadata


def get_url() -> str:
    """Return database URL from Alembic config, environment, or application config."""
    cfg_url = config.get_main_option("sqlalchemy.url")
    if cfg_url:
        return cfg_url
    return os.getenv("DATABASE_URL", DATABASE_URL)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    Configures the context with just a URL and not an Engine.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Creates an Engine and associates a connection with the context.
    """
    url = get_url()
    is_sqlite = url.startswith("sqlite")

    connect_args = {}
    if is_sqlite:
        connect_args["check_same_thread"] = False

    connectable = create_engine(
        url,
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    if is_sqlite:
        configure_sqlite_foreign_keys(connectable)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
