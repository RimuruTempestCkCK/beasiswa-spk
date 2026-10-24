from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ExperimentReport(BaseModel):
    preprocessing_run_id: int
    dataset_batch_id: int
    batch_name: str
    input_rows: int
    output_rows: int
    clustering_runs: List[Dict[str, Any]]
    selected_clustering_run_id: Optional[int]
    model_versions: List[Dict[str, Any]]


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    entity_type: str
    entity_id: Optional[str]
    details_json: Optional[Dict[str, Any]]
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedAuditLogs(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[AuditLogOut]
