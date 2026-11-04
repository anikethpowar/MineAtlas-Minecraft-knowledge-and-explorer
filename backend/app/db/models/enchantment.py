"""Enchantment ORM model."""

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin


class Enchantment(Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin):
    """Minecraft Enchantment entity.

    Covers modifiers applicable to equipment via table, anvil, or books.
    Identified by natural enchantment ID slug (e.g. 'sharpness', 'mending', 'fortune').
    """

    __tablename__ = "enchantments"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        doc="Natural enchantment slug identifier (e.g. 'sharpness', 'mending').",
    )
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
        doc="Display name (e.g. 'Sharpness', 'Mending').",
    )
    category: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        doc="Equipment category ('weapons', 'armor', 'tools', 'bow', 'trident').",
    )
    max_level: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        doc="Maximum attainable enchantment level (e.g. 5 for Sharpness, 1 for Mending).",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Description of magical bonus or effect applied.",
    )
    treasure_only: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether this enchantment can only be obtained via chests/trades (e.g. Mending).",
    )
    curse_of: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether this is a negative curse enchantment (e.g. Curse of Binding).",
    )
    weight: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Rarity weight in enchanting table selection calculations.",
    )
    version_added: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Minecraft Java Edition version when introduced.",
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Contextual notes on mechanics or incompatibilities.",
    )

    def __repr__(self) -> str:
        return f"<Enchantment(id={self.id!r}, name={self.name!r}, max_level={self.max_level})>"

