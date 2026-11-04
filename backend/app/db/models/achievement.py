"""Advancement / Achievement ORM model."""

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin


class Achievement(Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin):
    """Minecraft Advancement entity.

    Tracks Java Edition advancement trees (Story, Nether, End, Adventure, Husbandry).
    Identified by namespaced ID (e.g. 'minecraft:story/root', 'minecraft:nether/fast_travel').
    """

    __tablename__ = "achievements"

    id: Mapped[str] = mapped_column(
        String(128),
        primary_key=True,
        doc="Full namespaced advancement ID (e.g. 'minecraft:story/root').",
    )
    slug: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        doc="Short slug identifier (e.g. 'minecraft', 'fast_travel').",
    )
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
        doc="Display title shown in advancement screen (e.g. 'Minecraft', 'Subspace Bubble').",
    )
    tab: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        index=True,
        doc="UI tab tree ('minecraft', 'nether', 'end', 'adventure', 'husbandry').",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Advancement goal description text.",
    )
    icon: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        doc="Item or block icon displayed in the advancement badge.",
    )
    parent_id: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
        index=True,
        doc="Parent advancement ID in tree hierarchy (null for root advancements).",
    )
    how_to_complete: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Gameplay guidance for unlocking this advancement.",
    )
    xp_reward: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="Experience point reward awarded upon completion.",
    )
    is_goal: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether this advancement is categorized as a Goal.",
    )
    is_challenge: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether this advancement is categorized as a Challenge.",
    )
    difficulty: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Difficulty classification (e.g. 'easy', 'medium', 'hard').",
    )
    version_added: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Minecraft Java Edition version when introduced.",
    )

    def __repr__(self) -> str:
        return f"<Achievement(id={self.id!r}, name={self.name!r}, tab={self.tab!r})>"

