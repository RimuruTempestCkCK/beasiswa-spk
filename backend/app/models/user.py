from sqlalchemy import BigInteger, String, Boolean, Enum, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    operator = "operator"
    reviewer = "reviewer"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(190), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=UserRole.operator,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[object] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp()
    )

    # Relationships
    dataset_batches = relationship("DatasetBatch", back_populates="creator", foreign_keys="DatasetBatch.created_by")
    preprocessing_runs = relationship("PreprocessingRun", back_populates="creator")
    model_versions = relationship("ModelVersion", back_populates="creator")
    predictions = relationship("Prediction", back_populates="creator")
    audit_logs = relationship("AuditLog", back_populates="user")
