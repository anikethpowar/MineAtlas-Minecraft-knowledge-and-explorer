"""Structure ORM model."""

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin


class Structure(Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin):
    """Minecraft World Structure entity.

    Covers naturally generating structures (e.g. Village, Ancient City, Nether Fortress).
    Identified by natural structure ID slug (e.g. 'village', 'ancient_city').
    """

    __tablename__ = "structures"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        doc="Natural structure slug identifier (e.g. 'village', 'ancient_city').",
    )
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
        doc="Display name (e.g. 'Village', 'Ancient City').",
    )
    dimension: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        index=True,
        doc="Dimension where this structure generates ('overworld', 'nether', 'the_end').",
    )
    category: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        doc="Architectural or functional category ('settlement', 'dungeon', 'ruin', 'temple').",
    )
    rarity: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Generation rarity ('common', 'uncommon', 'rare').",
    )
    y_min: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Minimum typical Y-elevation bounding coordinate.",
    )
    y_max: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Maximum typical Y-elevation bounding coordinate.",
    )
    how_to_find: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Navigation or search guidance (e.g. explorer maps, eyes of ender).",
    )
    version_added: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Minecraft Java Edition version when introduced.",
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Contextual notes on generation rules or unique features.",
    )

    def __repr__(self) -> str:
        return f"<Structure(id={self.id!r}, name={self.name!r}, dimension={self.dimension!r})>"

