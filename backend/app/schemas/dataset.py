from pydantic import BaseModel, field_validator
from typing import Optional, List, Any
from datetime import datetime
from app.models.dataset import SourceType, BatchStatus, DataStatus


class DatasetBatchCreate(BaseModel):
    batch_name: str
    source_type: SourceType = SourceType.csv
    dataset_description: Optional[str] = None


class DatasetBatchOut(BaseModel):
    id: int
    batch_name: str
    source_filename: Optional[str]
    source_type: SourceType
    dataset_description: Optional[str]
    total_rows: int
    status: BatchStatus
    created_by: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentRecordCreate(BaseModel):
    dataset_batch_id: int
    student_code: Optional[str] = None
    student_name: Optional[str] = None
    ipk: Optional[float] = None
    parent_income: Optional[float] = None
    family_dependents: Optional[int] = None
    academic_achievement_score: Optional[float] = None
    nonacademic_achievement_score: Optional[float] = None
    attendance_percentage: Optional[float] = None


class StudentRecordUpdate(BaseModel):
    student_code: Optional[str] = None
    student_name: Optional[str] = None
    ipk: Optional[float] = None
    parent_income: Optional[float] = None
    family_dependents: Optional[int] = None
    academic_achievement_score: Optional[float] = None
    nonacademic_achievement_score: Optional[float] = None
    attendance_percentage: Optional[float] = None


class StudentRecordOut(BaseModel):
    id: int
    dataset_batch_id: int
    student_code: Optional[str]
    student_name: Optional[str]
    ipk: Optional[float]
    parent_income: Optional[float]
    family_dependents: Optional[int]
    academic_achievement_score: Optional[float]
    nonacademic_achievement_score: Optional[float]
    attendance_percentage: Optional[float]
    data_status: DataStatus
    validation_notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ImportValidationResult(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    preview: List[dict]
    issues: List[dict]


class PaginatedRecords(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[StudentRecordOut]
