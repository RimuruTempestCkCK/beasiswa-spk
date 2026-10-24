from sqlalchemy import (
    BigInteger, String, Integer, Boolean, Enum, TIMESTAMP,
    JSON, ForeignKey, DECIMAL, Index, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class ClusteringStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class ClusteringRun(Base):
    __tablename__ = "clustering_runs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    preprocessing_run_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("preprocessing_runs.id"), nullable=False
    )
    algorithm: Mapped[str] = mapped_column(String(50), nullable=False, default="KMeans")
    k_value: Mapped[int] = mapped_column(Integer, nullable=False)
    dbi_score: Mapped[float | None] = mapped_column(DECIMAL(12, 8), nullable=True)
    random_seed: Mapped[int | None] = mapped_column(Integer, nullable=True)
    config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[ClusteringStatus] = mapped_column(
        Enum(ClusteringStatus, name="clustering_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ClusteringStatus.queued,
    )
    is_selected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    artifact_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[object] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp()
    )

    __table_args__ = (
        Index("idx_cluster_preprocess", "preprocessing_run_id"),
    )

    # Relationships
    preprocessing_run = relationship("PreprocessingRun", back_populates="clustering_runs")
    cluster_assignments = relationship("ClusterAssignment", back_populates="clustering_run", cascade="all, delete-orphan")
    model_versions = relationship("ModelVersion", back_populates="target_clustering_run")


class ClusterAssignment(Base):
    __tablename__ = "cluster_assignments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    clustering_run_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("clustering_runs.id", ondelete="CASCADE"), nullable=False
    )
    student_record_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("student_records.id", ondelete="CASCADE"), nullable=False
    )
    cluster_label: Mapped[int] = mapped_column(Integer, nullable=False)
    distance_to_centroid: Mapped[float | None] = mapped_column(DECIMAL(14, 8), nullable=True)

    __table_args__ = (
        UniqueConstraint("clustering_run_id", "student_record_id", name="uq_cluster_record"),
    )

    # Relationships
    clustering_run = relationship("ClusteringRun", back_populates="cluster_assignments")
    student_record = relationship("StudentRecord", back_populates="cluster_assignments")
