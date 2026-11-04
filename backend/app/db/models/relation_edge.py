"""Knowledge graph relationship edge ORM model."""

from sqlalchemy import Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ProvenanceMixin, TimestampMixin


class RelationEdge(Base, ProvenanceMixin, TimestampMixin):
    """Generic Knowledge Graph relationship edge.

    Connects any two entities across MineAtlas via polymorphic references:
    (source_entity_type, source_entity_id) -[relationship_type]-> (target_entity_type, target_entity_id)

    Supported relationship types include:
    - SPAWNS_IN        (Mob -> Biome)
    - FOUND_IN         (Structure -> Biome)
    - DROPS            (Mob -> Item)
    - CRAFTS_INTO      (Item -> Item)
    - USED_FOR         (Item -> Mechanic/Farm)
    - TAMED_WITH       (Mob -> Item)
    - BREEDS_WITH      (Mob -> Item)
    - CONTAINS_LOOT    (Structure -> Item)
    - LOCATED_IN       (Biome -> Dimension)
    - TRADED_BY        (Item -> VillagerProfession)
    - REQUIRES         (Farm -> Mob / Item)
    - PRODUCES         (Farm -> Item)
    - UNLOCKS          (Item -> Achievement)
    - ADDED_IN         (Any -> Version)
    """

    __tablename__ = "relation_edges"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        doc="Surrogate primary key for the relationship edge.",
    )
    source_entity_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Source entity table/type (e.g. 'mob', 'structure', 'farm').",
    )
    source_entity_id: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Source entity natural identifier (e.g. 'zombie', 'village', 'iron-farm').",
    )
    relationship_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Semantic predicate verb (e.g. 'DROPS', 'SPAWNS_IN', 'PRODUCES').",
    )
    target_entity_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Target entity table/type (e.g. 'item', 'biome', 'mob').",
    )
    target_entity_id: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Target entity natural identifier (e.g. 'rotten_flesh', 'plains').",
    )
    metadata_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Optional relationship-specific properties (e.g. drop chance, yield quantity).",
    )

    __table_args__ = (
        # Fast traversal lookup from source entity outward
        Index(
            "ix_relation_edges_source",
            "source_entity_type",
            "source_entity_id",
        ),
        # Fast reverse lookup from target entity inward
        Index(
            "ix_relation_edges_target",
            "target_entity_type",
            "target_entity_id",
        ),
        # Fast query filtering by relationship type
        Index(
            "ix_relation_edges_type",
            "relationship_type",
        ),
        # Prevent identical duplicate relationship edges
        UniqueConstraint(
            "source_entity_type",
            "source_entity_id",
            "relationship_type",
            "target_entity_type",
            "target_entity_id",
            name="uq_relation_edge_unique_link",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<RelationEdge({self.source_entity_type}:{self.source_entity_id} "
            f"-[{self.relationship_type}]-> "
            f"{self.target_entity_type}:{self.target_entity_id})>"
        )

