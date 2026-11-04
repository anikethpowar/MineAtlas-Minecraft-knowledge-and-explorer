"""Mob ORM model."""

from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin


class Mob(Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin):
    """Minecraft Mob entity.

    Identified by natural ID slug (e.g. 'cow', 'zombie', 'iron_golem').
    """

    __tablename__ = "mobs"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        doc="Natural mob slug identifier (e.g. 'cow', 'zombie').",
    )
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
        doc="Display name (e.g. 'Cow', 'Zombie').",
    )
    mob_type: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        index=True,
        doc="Mob behavioral type ('passive', 'hostile', 'neutral', 'boss').",
    )
    category: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        doc="Biological or mechanical category (e.g. 'animal', 'undead', 'arthropod').",
    )
    behavior: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="High-level description of behavior patterns.",
    )
    hp: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        doc="Base health points (e.g. 10.0 for Cow, 20.0 for Zombie, 100.0 for Iron Golem).",
    )
    damage_easy: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        doc="Melee damage dealt on Easy difficulty.",
    )
    damage_normal: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        doc="Melee damage dealt on Normal difficulty.",
    )
    damage_hard: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        doc="Melee damage dealt on Hard difficulty.",
    )
    xp_min: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Minimum experience points dropped upon player kill.",
    )
    xp_max: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Maximum experience points dropped upon player kill.",
    )
    spawn_conditions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Summary of light levels, block surfaces, and pack size spawn rules.",
    )
    tameable: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether this mob can be tamed by a player.",
    )
    taming_method: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Item or process required for taming.",
    )
    breedable: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether this mob can be bred to produce offspring.",
    )
    breeding_item: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Food or item required to induce love mode.",
    )
    version_added: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Minecraft Java Edition version when introduced.",
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Contextual notes or unique mechanics.",
    )

    def __repr__(self) -> str:
        return f"<Mob(id={self.id!r}, name={self.name!r}, type={self.mob_type!r})>"

