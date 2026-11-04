"""Item ORM model."""

from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin


class Item(Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin):
    """Minecraft Item & Key Block entity.

    Covers key items and functional blocks (not exhaustive decorative block permutations).
    Identified by natural item ID slug (e.g. 'wooden_pickaxe', 'diamond', 'iron_ingot').
    """

    __tablename__ = "items"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        doc="Natural item slug identifier (e.g. 'wooden_pickaxe', 'diamond').",
    )
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
        doc="Display name (e.g. 'Wooden Pickaxe', 'Diamond').",
    )
    category: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        doc="Item category (e.g. 'tool', 'combat', 'resource', 'food', 'redstone').",
    )
    stack_size: Mapped[int] = mapped_column(
        Integer,
        default=64,
        nullable=False,
        doc="Maximum inventory stack size (typically 64, 16, or 1).",
    )
    durability: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Maximum durability points (null for non-durability items).",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Factual gameplay description of utility and mining tier.",
    )
    enchantable: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether this item accepts enchantments via table or anvil.",
    )
    food_hunger: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Hunger points restored upon consumption (null for non-food).",
    )
    food_saturation: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        doc="Saturation value restored upon consumption (null for non-food).",
    )
    fuel_value: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Smelting fuel burn time in game ticks (null for non-fuels).",
    )
    version_added: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Minecraft Java Edition version when introduced.",
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Contextual notes or special mechanics.",
    )

    def __repr__(self) -> str:
        return f"<Item(id={self.id!r}, name={self.name!r}, category={self.category!r})>"

