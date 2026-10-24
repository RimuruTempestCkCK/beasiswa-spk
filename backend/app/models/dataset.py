from sqlalchemy import (
    BigInteger, String, Text, Integer, SmallInteger, Enum,
    TIMESTAMP, DECIMAL, ForeignKey, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class SourceType(str, enum.Enum):
    excel = "excel"
    csv = "csv"
    manual = "manual"
    synthetic = "synthetic"


class BatchStatus(str, enum.Enum):
    draft = "draft"
    imported = "imported"
    validated = "validated"
    rejected = "rejected"


class DataStatus(str, enum.Enum):
    raw = "raw"
    validated = "validated"
    invalid = "invalid"


class DatasetBatch(Base):
    __tablename__ = "dataset_batches"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    batch_name: Mapped[str] = mapped_column(String(150), nullable=False)
    source_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_type: Mapped[SourceType] = mapped_column(
        Enum(SourceType, name="source_type_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=SourceType.csv,
    )
    dataset_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[BatchStatus] = mapped_column(
        Enum(BatchStatus, name="batch_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=BatchStatus.draft,
    )
    created_by: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[object] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp()
    )

    # Relationships
    creator = relationship("User", back_populates="dataset_batches", foreign_keys=[created_by])
    student_records = relationship("StudentRecord", back_populates="dataset_batch", cascade="all, delete-orphan")
    preprocessing_runs = relationship("PreprocessingRun", back_populates="dataset_batch")


class StudentRecord(Base):
    __tablename__ = "student_records"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    dataset_batch_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("dataset_batches.id", ondelete="CASCADE"), nullable=False
    )
    student_code: Mapped[str | None] = mapped_column(String(60), nullable=True)
    student_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    ipk: Mapped[float | None] = mapped_column(DECIMAL(4, 2), nullable=True)
    parent_income: Mapped[float | None] = mapped_column(DECIMAL(15, 2), nullable=True)
    family_dependents: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    academic_achievement_score: Mapped[float | None] = mapped_column(DECIMAL(8, 3), nullable=True)
    nonacademic_achievement_score: Mapped[float | None] = mapped_column(DECIMAL(8, 3), nullable=True)
    attendance_percentage: Mapped[float | None] = mapped_column(DECIMAL(5, 2), nullable=True)
    data_status: Mapped[DataStatus] = mapped_column(
        Enum(DataStatus, name="data_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=DataStatus.raw,
    )
    validation_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[object] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp()
    )

    __table_args__ = (
        Index("idx_record_batch", "dataset_batch_id"),
        Index("idx_record_code", "student_code"),
    )

    # Relationships
    dataset_batch = relationship("DatasetBatch", back_populates="student_records")
    cluster_assignments = relationship("ClusterAssignment", back_populates="student_record", cascade="all, delete-orphan")
