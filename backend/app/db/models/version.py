"""Minecraft Version History ORM model."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin


class Version(Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin):
    """Minecraft Release Version entity.

    Tracks Java Edition release history, major update titles, and chronological lineage.
    Identified by stable version slug (e.g. '1-21', '1-20', '1-0').
    """

    __tablename__ = "versions"

    slug: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        doc="Stable URL/database slug for this version (e.g. '1-21', '1-0').",
    )
    name: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        doc="Human-readable release identifier (e.g. '1.21', '1.0').",
    )
    edition: Mapped[str] = mapped_column(
        String(32),
        default="java",
        nullable=False,
        doc="Targeted edition (always 'java' for MineAtlas).",
    )
    release_date: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Official release date string (YYYY-MM-DD).",
    )
    release_type: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Release classification ('major-release', 'minor-release', 'snapshot').",
    )
    update_name: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
        doc="Thematic update marketing title (e.g. 'Tricky Trials', 'Caves & Cliffs').",
    )
    previous_version_slug: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Slug reference to immediate predecessor version.",
    )
    next_version_slug: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Slug reference to immediate successor version.",
    )

    def __repr__(self) -> str:
        return f"<Version(slug={self.slug!r}, name={self.name!r}, update_name={self.update_name!r})>"

