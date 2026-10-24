from pydantic import BaseModel, model_validator
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
    model_name: Optional[str] = "Backpropagation MLP"
    model_version: Optional[str] = None
    clustering_run_id: int
    config: Optional[TrainingConfig] = None
    # Top-level fields from frontend:
    hidden_layers: Optional[Any] = None
    learning_rate: Optional[float] = None
    max_epochs: Optional[int] = None
    test_size: Optional[float] = None
    random_seed: Optional[int] = None
    activation: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if not values.get("model_name"):
                values["model_name"] = "Backpropagation MLP"
            if not values.get("model_version"):
                import time
                values["model_version"] = f"v1.{int(time.time()) % 1000}"
            cfg = values.get("config")
            if cfg is None:
                hidden = values.get("hidden_layers")
                if isinstance(hidden, str):
                    hidden = [int(x.strip()) for x in hidden.split(",") if x.strip()]
                elif not isinstance(hidden, list):
                    hidden = [64, 32]
                lr = values.get("learning_rate") if values.get("learning_rate") is not None else 0.001
                epochs = values.get("max_epochs") if values.get("max_epochs") is not None else 500
                seed = values.get("random_seed") if values.get("random_seed") is not None else 42
                ts = values.get("test_size") if values.get("test_size") is not None else 0.2
                act = values.get("activation") or "relu"
                values["config"] = {
                    "hidden_layer_sizes": hidden,
                    "learning_rate_init": float(lr),
                    "max_iter": int(epochs),
                    "random_state": int(seed),
                    "test_size": float(ts),
                    "activation": str(act),
                }
        return values


class ModelVersionOut(BaseModel):
    id: int
    model_name: str
    name: Optional[str] = None
    model_version: str
    version: Optional[str] = None
    target_clustering_run_id: int
    clustering_run_id: Optional[int] = None
    algorithm: str
    training_config: Optional[Dict[str, Any]]
    metrics: Optional[Dict[str, Any]]
    accuracy: Optional[float] = None
    artifact_path: Optional[str]
    status: ModelStatus
    created_by: Optional[int]
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            m_name = getattr(data, "model_name", None)
            m_ver = getattr(data, "model_version", None)
            clust_id = getattr(data, "target_clustering_run_id", None)
            metrics = getattr(data, "metrics", {}) or {}
            acc = metrics.get("accuracy") if isinstance(metrics, dict) else None
            setattr(data, "name", m_name)
            setattr(data, "version", m_ver)
            setattr(data, "clustering_run_id", clust_id)
            setattr(data, "accuracy", acc)
        elif isinstance(data, dict):
            data["name"] = data.get("model_name")
            data["version"] = data.get("model_version")
            data["clustering_run_id"] = data.get("target_clustering_run_id")
            metrics = data.get("metrics") or {}
            if isinstance(metrics, dict):
                data["accuracy"] = metrics.get("accuracy")
        return data

    model_config = {"from_attributes": True}


class ModelVersionListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ModelVersionOut]


TrainingCreateRequest = ModelTrainRequest
ModelVersionResponse = ModelVersionOut
