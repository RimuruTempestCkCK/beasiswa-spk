from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.models.clustering import ClusteringStatus


class ClusteringRunCreate(BaseModel):
    preprocessing_run_id: int
    k_values: List[int]  # List of k values to try
    random_seed: int = 42
    config: Optional[Dict[str, Any]] = None


class ClusteringRunOut(BaseModel):
    id: int
    preprocessing_run_id: int
    algorithm: str
    k_value: int
    dbi_score: Optional[float]
    random_seed: Optional[int]
    config: Optional[Dict[str, Any]]
    status: ClusteringStatus
    is_selected: bool
    artifact_path: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ClusterAssignmentOut(BaseModel):
    id: int
    clustering_run_id: int
    student_record_id: int
    cluster_label: int
    distance_to_centroid: Optional[float]

    model_config = {"from_attributes": True}


class ClusterProfile(BaseModel):
    cluster_label: int
    count: int
    centroid: List[float]
    feature_means: Dict[str, float]


ClusteringRunCreateRequest = ClusteringRunCreate
ClusteringRunResponse = ClusteringRunOut
