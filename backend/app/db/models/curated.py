"""Curated and future-extensible ORM models.

Covers curated Java Edition dimensions, world generation types,
verified farm architectures, and core game mechanics.
"""

from sqlalchemy import Boolean, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ProvenanceMixin, TimestampMixin


class Dimension(Base, ProvenanceMixin, TimestampMixin):
    """Minecraft Dimension entity (Overworld, The Nether, The End)."""

    __tablename__ = "dimensions"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        doc="Dimension natural ID ('overworld', 'nether', 'the_end').",
    )
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Display name (e.g. 'The Overworld', 'The Nether').",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Environmental and dimensional characteristics.",
    )
    has_skylight: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        doc="Whether sunlight and celestial bodies exist.",
    )
    bed_works: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        doc="Whether beds can be used to sleep without exploding.",
    )
    respawn_anchor_works: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="Whether respawn anchors can set spawn points safely.",
    )
    min_y: Mapped[int] = mapped_column(
        Integer,
        default=-64,
        nullable=False,
        doc="Minimum building and generation Y coordinate.",
    )
    max_y: Mapped[int] = mapped_column(
        Integer,
        default=320,
        nullable=False,
        doc="Maximum building Y coordinate.",
    )

    def __repr__(self) -> str:
        return f"<Dimension(id={self.id!r}, name={self.name!r})>"


class WorldType(Base, ProvenanceMixin, TimestampMixin):
    """Minecraft World Generator Preset entity."""

    __tablename__ = "world_types"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        doc="World type slug (e.g. 'default', 'flat', 'large_biomes', 'amplified', 'single_biome').",
    )
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Display name (e.g. 'Default', 'Superflat', 'Large Biomes').",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Explanation of terrain generation and biome scaling.",
    )
    generator_type: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        doc="Internal generator key used by Minecraft world options.",
    )

    def __repr__(self) -> str:
        return f"<WorldType(id={self.id!r}, name={self.name!r})>"


class Farm(Base, ProvenanceMixin, TimestampMixin):
    """Curated Minecraft Farm Guide entity.

    Covers handcrafted, version-verified Java Edition farm architectures.
    """

    __tablename__ = "farms"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        doc="Unique farm guide slug (e.g. 'iron-farm-simple', 'creeper-farm-gunpowder').",
    )
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
        doc="Title of farm guide (e.g. 'Simple 3-Villager Iron Farm').",
    )
    category: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        doc="Farm category ('iron', 'mob', 'crop', 'wood', 'experience', 'villager').",
    )
    difficulty: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Construction difficulty ('beginner', 'intermediate', 'advanced').",
    )
    estimated_output_per_hour: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Empirically verified production yield per hour (e.g. '300-400 Iron Ingots/hour').",
    )
    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Concise overview of mechanism and resource efficiency.",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Detailed architectural breakdown and step-by-step principles.",
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Caveats, simulation distance requirements, or common builder mistakes.",
    )
    dimension: Mapped[str] = mapped_column(
        String(64),
        default="Overworld",
        nullable=False,
        doc="Dimension where the farm operates (e.g. 'Overworld', 'The Nether', 'The End').",
    )
    compatibility_label: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
        doc="Human-friendly version compatibility badge (e.g. 'Minecraft Java Edition 1.14 - 1.21+').",
    )
    safety_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Important player safety, mob containment, or anti-lightning measures.",
    )
    maintenance_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Ongoing maintenance, storage clearing, or simulation distance rules.",
    )
    outputs: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        doc="Structured list of farm outputs with labels, items, and yields.",
    )
    materials: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        doc="Structured materials bill with amounts, categories, and practical notes.",
    )
    prerequisites: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        doc="Structured list of prerequisites (locations, mobs, tools) required before building.",
    )
    build_steps: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        doc="Ordered build steps with title, instructions, and why_it_matters explanation.",
    )
    troubleshooting: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        doc="Common failure symptoms, root causes, and verification checklists.",
    )
    diagram_data: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        doc="Configurable parameters and zone definitions for explanatory visual schematics.",
    )
    source_references: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        doc="Curated source documentation, mechanics citations, and reference links.",
    )

    def __repr__(self) -> str:
        return f"<Farm(id={self.id!r}, name={self.name!r}, category={self.category!r})>"


class Mechanic(Base, ProvenanceMixin, TimestampMixin):
    """Minecraft Core Game Mechanic reference entity.

    Explains underlying Java Edition game rules governing mob spawning,
    villager gossip, redstone timings, and despawn spheres.
    """

    __tablename__ = "mechanics"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        doc="Unique mechanic slug (e.g. 'villager-golem-spawning', 'piston-quasi-connectivity').",
    )
    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
        doc="Title of game mechanic (e.g. 'Iron Golem Panic Spawning', 'Quasi-Connectivity').",
    )
    category: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        doc="Mechanic category ('spawning', 'redstone', 'combat', 'villagers', 'pathfinding').",
    )
    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Concise high-level summary of the rule.",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Detailed technical breakdown of game engine logic.",
    )
    java_specific_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Explicit documentation of Java-exclusive behaviors distinct from Bedrock.",
    )

    def __repr__(self) -> str:
        return f"<Mechanic(id={self.id!r}, name={self.name!r}, category={self.category!r})>"

