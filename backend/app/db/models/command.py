"""Command ORM model."""

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin


class Command(Base, ProvenanceMixin, TimestampMixin, UpstreamPayloadMixin):
    """Minecraft In-Game Command entity.

    Identified by natural command name (e.g. 'give', 'teleport', 'weather').
    """

    __tablename__ = "commands"

    name: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        doc="Natural command name without leading slash (e.g. 'give', 'time').",
    )
    syntax: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Command invocation syntax string (e.g. '/give <targets> <item> [<count>]').",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Description of what the command executes.",
    )
    permission_level: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="Required permission level (0 = all players, 2 = cheat commands, 4 = server admin).",
    )
    category: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        doc="Command category (e.g. 'player', 'world', 'utility', 'server').",
    )
    version_added: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        doc="Minecraft Java Edition version when introduced.",
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Common mistakes or usage notes.",
    )

    def __repr__(self) -> str:
        return f"<Command(name={self.name!r}, permission_level={self.permission_level})>"

