from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.preprocessing import RunStatus


class PreprocessingRunCreate(BaseModel):
    dataset_batch_id: int
    method_version: str = "v1"
    config: Optional[Dict[str, Any]] = None


class PreprocessingRunOut(BaseModel):
    id: int
    dataset_batch_id: int
    method_version: str
    config: Optional[Dict[str, Any]]
    status: RunStatus
    input_rows: int
    output_rows: int
    artifact_path: Optional[str]
    error_message: Optional[str]
    created_by: Optional[int]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
