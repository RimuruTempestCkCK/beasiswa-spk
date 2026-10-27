from sqlalchemy import (
    BigInteger, SmallInteger, Text, Enum, TIMESTAMP, DECIMAL,
    ForeignKey, Index, Integer, String
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    model_version_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("model_versions.id"), nullable=False
    )
    student_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    student_code: Mapped[str | None] = mapped_column(String(60), nullable=True)
    ipk: Mapped[float] = mapped_column(DECIMAL(4, 2), nullable=False)
    parent_income: Mapped[float] = mapped_column(DECIMAL(15, 2), nullable=False)
    family_dependents: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    academic_achievement_score: Mapped[float] = mapped_column(DECIMAL(8, 3), nullable=False)
    nonacademic_achievement_score: Mapped[float] = mapped_column(DECIMAL(8, 3), nullable=False)
    attendance_percentage: Mapped[float] = mapped_column(DECIMAL(5, 2), nullable=False)
    predicted_cluster: Mapped[int] = mapped_column(Integer, nullable=False)
    confidence_score: Mapped[float | None] = mapped_column(DECIMAL(8, 7), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[object] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp()
    )

    __table_args__ = (
        Index("idx_prediction_created", "created_at"),
    )

    # Relationships
    model_version = relationship("ModelVersion", back_populates="predictions")
    creator = relationship("User", back_populates="predictions")
