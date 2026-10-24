from sqlalchemy import (
    BigInteger, String, Enum, TIMESTAMP, JSON, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class ModelStatus(str, enum.Enum):
    training = "training"
    ready = "ready"
    failed = "failed"
    archived = "archived"


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    model_name: Mapped[str] = mapped_column(String(150), nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    target_clustering_run_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("clustering_runs.id"), nullable=False
    )
    algorithm: Mapped[str] = mapped_column(String(50), nullable=False, default="Backpropagation")
    training_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    artifact_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[ModelStatus] = mapped_column(
        Enum(ModelStatus, name="model_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ModelStatus.training,
    )
    created_by: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[object] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp()
    )

    __table_args__ = (
        UniqueConstraint("model_name", "model_version", name="uq_model_version"),
    )

    # Relationships
    target_clustering_run = relationship("ClusteringRun", back_populates="model_versions")
    creator = relationship("User", back_populates="model_versions")
    predictions = relationship("Prediction", back_populates="model_version")
