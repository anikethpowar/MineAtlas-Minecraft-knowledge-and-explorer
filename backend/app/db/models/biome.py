"""Biome ORM model."""

from sqlalchemy import Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin


class Biome(Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin):
    """Minecraft Biome entity.

    Identified by namespaced ID (e.g. 'minecraft:plains', 'minecraft:desert').
    """

    __tablename__ = "biomes"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        doc="Namespaced natural biome ID (e.g. 'minecraft:plains').",
    )
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
        doc="Human-readable biome name (e.g. 'Plains').",
    )
    dimension: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        index=True,
        doc="Target dimension ('overworld', 'nether', 'the_end').",
    )
    category: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        doc="Climatic or environmental category (e.g. 'temperate', 'arid', 'cold').",
    )
    temperature: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        doc="Biome ambient temperature float value.",
    )
    precipitation: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Precipitation type ('rain', 'snow', 'none').",
    )
    rarity: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Spawn rarity ('common', 'uncommon', 'rare').",
    )
    version_added: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Minecraft Java Edition version when this biome was introduced.",
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Contextual notes or generation peculiarities.",
    )

    def __repr__(self) -> str:
        return f"<Biome(id={self.id!r}, name={self.name!r}, dimension={self.dimension!r})>"

