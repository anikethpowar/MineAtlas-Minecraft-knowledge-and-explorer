"""Villager Profession and Trade ORM models."""

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin


class VillagerProfession(Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin):
    """Minecraft Villager Profession entity.

    Covers the 13 vanilla professions and their assigned workstation blocks.
    Identified by stable profession ID (e.g. 'armorer', 'librarian', 'cleric').
    """

    __tablename__ = "villager_professions"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        doc="Natural profession slug (e.g. 'armorer', 'librarian', 'cleric').",
    )
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
        doc="Display title (e.g. 'Armorer', 'Librarian').",
    )
    workstation: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
        doc="Required job site workstation block (e.g. 'Blast Furnace', 'Lectern').",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Summary of items traded by this profession.",
    )
    biome_specific: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether trades vary based on villager biome clothing origin.",
    )

    # One-to-many relationship to individual trades
    trades: Mapped[list["Trade"]] = relationship(
        "Trade",
        back_populates="profession",
        cascade="all, delete-orphan",
        doc="Individual trade offers unlocked by this profession across mastery levels.",
    )

    def __repr__(self) -> str:
        return f"<VillagerProfession(id={self.id!r}, workstation={self.workstation!r})>"


class Trade(Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin):
    """Individual Villager Trade offer.

    Represents a specific transaction tier (Novice to Master) offered by a profession.
    """

    __tablename__ = "trades"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        doc="Surrogate primary key for trade row.",
    )
    trade_id: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=False,
        doc="Stable natural trade identifier (e.g. 'armorer-1-coal-emerald').",
    )
    profession_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("villager_professions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Foreign key reference to villager_professions.id.",
    )
    level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="Trade mastery level (1 = Novice, 2 = Apprentice, 3 = Journeyman, 4 = Expert, 5 = Master).",
    )
    level_name: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Mastery level name ('Novice', 'Apprentice', etc.).",
    )
    gives_item: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Item player gives to the villager (e.g. 'Coal').",
    )
    gives_amount: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        doc="Quantity of input item required.",
    )
    receives_item: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Item villager gives to the player (e.g. 'Emerald').",
    )
    receives_amount: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        doc="Quantity of output item provided.",
    )
    max_uses: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Maximum uses before trade locks until villager works.",
    )
    price_multiplier: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        doc="Demand-based price elasticity multiplier.",
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Contextual trade conditions or enchanting levels.",
    )

    profession: Mapped["VillagerProfession"] = relationship(
        "VillagerProfession",
        back_populates="trades",
    )

    def __repr__(self) -> str:
        return (
            f"<Trade(id={self.id}, profession={self.profession_id!r}, "
            f"level={self.level}, gives='{self.gives_amount} {self.gives_item}', "
            f"receives='{self.receives_amount} {self.receives_item}')>"
        )

