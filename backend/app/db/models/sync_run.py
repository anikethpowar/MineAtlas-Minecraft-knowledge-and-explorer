"""Operational sync run metadata model."""

from datetime import datetime
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utc_now


class SyncRun(Base):
    """Operational audit and ingestion sync log.

    Maintains execution records for upstream synchronization passes.
    Schema foundation for Phase 4; syncing execution is not active in Phase 3.
    """

    __tablename__ = "sync_runs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        doc="Surrogate primary key for sync execution.",
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="UTC timestamp when synchronization began.",
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="UTC timestamp when synchronization finished.",
    )
    status: Mapped[str] = mapped_column(
        String(32),
        default="pending",
        nullable=False,
        index=True,
        doc="Run state ('pending', 'running', 'success', 'failed').",
    )
    trigger_type: Mapped[str] = mapped_column(
        String(32),
        default="manual",
        nullable=False,
        doc="Initiation trigger ('manual', 'audit', 'scheduled').",
    )
    endpoints_synced: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="Count of endpoints queried during this run.",
    )
    records_ingested: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="Count of individual records inserted or updated.",
    )
    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Failure reason or error trace summary if status is 'failed'.",
    )
    summary_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Serialized JSON summary of per-endpoint record counts and timings.",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
        doc="UTC timestamp when record was logged.",
    )

    def __repr__(self) -> str:
        return f"<SyncRun(id={self.id}, status={self.status!r}, records={self.records_ingested})>"

