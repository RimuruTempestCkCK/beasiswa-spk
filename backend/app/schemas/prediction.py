from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class PredictionRequest(BaseModel):
    model_version_id: int
    ipk: float
    parent_income: float
    family_dependents: int
    academic_achievement_score: float
    nonacademic_achievement_score: float
    attendance_percentage: float
    notes: Optional[str] = None

    @field_validator("ipk")
    @classmethod
    def validate_ipk(cls, v: float) -> float:
        if not 0.0 <= v <= 4.0:
            raise ValueError("IPK must be between 0.0 and 4.0")
        return v

    @field_validator("parent_income")
    @classmethod
    def validate_income(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Parent income must be greater than 0")
        return v

    @field_validator("family_dependents")
    @classmethod
    def validate_dependents(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Family dependents must be >= 0")
        return v

    @field_validator("attendance_percentage")
    @classmethod
    def validate_attendance(cls, v: float) -> float:
        if not 0.0 <= v <= 100.0:
            raise ValueError("Attendance percentage must be between 0 and 100")
        return v


class PredictionOut(BaseModel):
    id: int
    model_version_id: int
    ipk: float
    parent_income: float
    family_dependents: int
    academic_achievement_score: float
    nonacademic_achievement_score: float
    attendance_percentage: float
    predicted_cluster: int
    confidence_score: Optional[float]
    notes: Optional[str]
    created_by: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


PredictionCreateRequest = PredictionRequest
PredictionResponse = PredictionOut


class PaginatedPredictions(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[PredictionOut]
