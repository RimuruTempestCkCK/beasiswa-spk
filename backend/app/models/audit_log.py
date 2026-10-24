from sqlalchemy import (
    BigInteger, String, Text, TIMESTAMP, JSON, ForeignKey, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    details_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[object] = mapped_column(
        TIMESTAMP, nullable=False, server_default=func.current_timestamp()
    )

    __table_args__ = (
        Index("idx_audit_created", "created_at"),
        Index("idx_audit_entity", "entity_type", "entity_id"),
    )

    # Relationships
    user = relationship("User", back_populates="audit_logs")
