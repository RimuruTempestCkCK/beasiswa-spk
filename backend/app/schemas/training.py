from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from app.models.model_version import ModelStatus


class TrainingConfig(BaseModel):
    hidden_layer_sizes: List[int] = [64, 32]
    learning_rate_init: float = 0.001
    max_iter: int = 500
    random_state: int = 42
    test_size: float = 0.2
    activation: str = "relu"


class ModelTrainRequest(BaseModel):
    model_name: str
    model_version: str
    clustering_run_id: int
    config: Optional[TrainingConfig] = None


class ModelVersionOut(BaseModel):
    id: int
    model_name: str
    model_version: str
    target_clustering_run_id: int
    algorithm: str
    training_config: Optional[Dict[str, Any]]
    metrics: Optional[Dict[str, Any]]
    artifact_path: Optional[str]
    status: ModelStatus
    created_by: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}
