from pydantic import BaseModel, model_validator
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.preprocessing import RunStatus


class PreprocessingRunCreate(BaseModel):
    dataset_batch_id: Optional[int] = None
    dataset_id: Optional[int] = None
    method_version: str = "v1"
    config: Optional[Dict[str, Any]] = None
    missing_strategy: Optional[str] = None
    normalization: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            batch_id = values.get("dataset_batch_id") or values.get("dataset_id")
            if not batch_id:
                raise ValueError("dataset_batch_id or dataset_id is required")
            values["dataset_batch_id"] = int(batch_id)
            cfg = dict(values.get("config") or {})
            if values.get("missing_strategy"):
                cfg["missing_strategy"] = values["missing_strategy"]
            if values.get("normalization"):
                cfg["normalization"] = values["normalization"]
            values["config"] = cfg
        return values


class PreprocessingRunOut(BaseModel):
    id: int
    dataset_batch_id: int
    dataset_id: Optional[int] = None
    dataset_name: Optional[str] = None
    method_version: str
    config: Optional[Dict[str, Any]]
    normalization: Optional[str] = None
    normalization_method: Optional[str] = None
    status: RunStatus
    input_rows: int
    output_rows: int
    artifact_path: Optional[str]
    error_message: Optional[str]
    created_by: Optional[int]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            batch_id = getattr(data, "dataset_batch_id", None)
            setattr(data, "dataset_id", batch_id)
            cfg = getattr(data, "config", {}) or {}
            norm = cfg.get("normalization", "minmax")
            setattr(data, "normalization", norm)
            setattr(data, "normalization_method", norm)
        elif isinstance(data, dict):
            data["dataset_id"] = data.get("dataset_batch_id")
            cfg = data.get("config") or {}
            norm = cfg.get("normalization", "minmax")
            data["normalization"] = norm
            data["normalization_method"] = norm
        return data

    model_config = {"from_attributes": True}


PreprocessingRunCreateRequest = PreprocessingRunCreate
PreprocessingRunResponse = PreprocessingRunOut
