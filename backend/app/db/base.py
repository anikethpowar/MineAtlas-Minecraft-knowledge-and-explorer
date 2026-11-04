"""SQLAlchemy base declarative class and common model mixins."""

from datetime import datetime, timezone
from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utc_now() -> datetime:
    """Return the current timestamp in UTC with timezone information."""
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models in MineAtlas."""


class TimestampMixin:
    """Provides standard UTC created_at and updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="UTC timestamp when this record was first created in the database.",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
        doc="UTC timestamp when this record was last modified in the database.",
    )


class ProvenanceMixin:
    """Preserves origin, edition, version, and verification metadata for each entity.

    Allowed source_type values:
    - 'astroworld_api': Synchronized directly from upstream Astroworld API.
    - 'curated': Verified, handcrafted Java Edition content (e.g. farm guides).
    - 'calculated': Derived/computed metrics (e.g. spawn difficulty scores).
    """

    source_type: Mapped[str] = mapped_column(
        String(32),
        default="astroworld_api",
        nullable=False,
        index=True,
        doc="Provenance category: 'astroworld_api', 'curated', or 'calculated'.",
    )
    source_url: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
        doc="Original URL or API endpoint where this data was obtained.",
    )
    edition: Mapped[str] = mapped_column(
        String(32),
        default="java",
        nullable=False,
        doc="Targeted Minecraft edition ('java' only for MineAtlas).",
    )
    game_version: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Minecraft version this record applies to (e.g. '1.21', '1.20.4').",
    )
    last_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="UTC timestamp when this content was last verified against source.",
    )
    coverage_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Human-readable factual note on data completeness or caveats.",
    )


class UpstreamPayloadMixin:
    """Retains the verbatim upstream JSON text for complete traceability."""

    raw_payload: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Verbatim JSON string from the upstream source for fields not yet mapped.",
    )

