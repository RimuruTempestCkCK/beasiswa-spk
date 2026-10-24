from sqlalchemy import (
    BigInteger, String, Text, Integer, Enum, TIMESTAMP, JSON,
    ForeignKey, DateTime
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class RunStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class PreprocessingRun(Base):
    __tablename__ = "preprocessing_runs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    dataset_batch_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("dataset_batches.id"), nullable=False
    )
    method_version: Mapped[str] = mapped_column(String(50), nullable=False)
    config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[RunStatus] = mapped_column(
        Enum(RunStatus, name="preprocessing_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=RunStatus.queued,
    )
    input_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    output_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    artifact_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    started_at: Mapped[object | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[object | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[object] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp()
    )

    # Relationships
    dataset_batch = relationship("DatasetBatch", back_populates="preprocessing_runs")
    creator = relationship("User", back_populates="preprocessing_runs")
    clustering_runs = relationship("ClusteringRun", back_populates="preprocessing_run")
