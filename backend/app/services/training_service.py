import os
import uuid
import numpy as np
import pandas as pd
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories.model_repo import ModelRepository
from app.repositories.clustering_repo import ClusteringRepository
from app.repositories.preprocessing_repo import PreprocessingRepository
from app.repositories.dataset_repo import DatasetRepository
from app.models.model_version import ModelStatus
from app.ml.preprocessing import load_preprocessing_artifact, preprocess_transform
from app.ml.backpropagation import train_model, save_model_artifact
from app.ml.evaluation import evaluate_model
from app.ml.data_validation import REQUIRED_FEATURES


class TrainingService:
    def __init__(self, db: Session):
        self.db = db
        self.model_repo = ModelRepository(db)
        self.clustering_repo = ClusteringRepository(db)
        self.preprocess_repo = PreprocessingRepository(db)
        self.dataset_repo = DatasetRepository(db)

    def list_models(self, page: int = 1, page_size: int = 20) -> dict:
        skip = (page - 1) * page_size
        total, items = self.model_repo.list_models(skip=skip, limit=page_size)
        return {"total": total, "page": page, "page_size": page_size, "items": items}

    def get_model(self, model_id: int):
        model = self.model_repo.get_by_id(model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model version not found")
        return model

    def create_training(
        self,
        model_name: str,
        model_version: str,
        clustering_run_id: int,
        config: Optional[Any],
        created_by: Optional[int],
    ):
        # Validate clustering run
        clustering_run = self.clustering_repo.get_run_by_id(clustering_run_id)
        if not clustering_run:
            raise HTTPException(status_code=404, detail="Clustering run not found")
        if clustering_run.status != "completed":
            raise HTTPException(status_code=400, detail="Clustering run is not completed")

        cfg = config.dict() if hasattr(config, "dict") else (config or {})

        model = self.model_repo.create(
            model_name=model_name,
            model_version=model_version,
            target_clustering_run_id=clustering_run_id,
            algorithm="Backpropagation",
            training_config=cfg,
            status=ModelStatus.training.value,
            created_by=created_by,
        )
        return model

    def execute_training(self, model_id: int) -> None:
        """Execute training (background task)."""
        model = self.model_repo.get_by_id(model_id)
        if not model:
            return

        try:
            clustering_run = self.clustering_repo.get_run_by_id(model.target_clustering_run_id)
            if not clustering_run or not clustering_run.artifact_path:
                raise ValueError("Clustering run artifact not found")

            prep_run = self.preprocess_repo.get_by_id(clustering_run.preprocessing_run_id)
            if not prep_run or not prep_run.artifact_path:
                raise ValueError("Preprocessing artifact not found")

            # Load preprocessing artifact
            prep_artifact = load_preprocessing_artifact(prep_run.artifact_path)
            scaler = prep_artifact["scaler"]
            medians = prep_artifact["medians"]

            # Get records
            records = self.dataset_repo.get_records_for_batch(prep_run.dataset_batch_id)
            data = []
            for r in records:
                data.append({
                    "ipk": float(r.ipk) if r.ipk is not None else None,
                    "parent_income": float(r.parent_income) if r.parent_income is not None else None,
                    "family_dependents": float(r.family_dependents) if r.family_dependents is not None else None,
                    "academic_achievement_score": float(r.academic_achievement_score) if r.academic_achievement_score is not None else None,
                    "nonacademic_achievement_score": float(r.nonacademic_achievement_score) if r.nonacademic_achievement_score is not None else None,
                    "attendance_percentage": float(r.attendance_percentage) if r.attendance_percentage is not None else None,
                })
            df = pd.DataFrame(data)
            X = preprocess_transform(df, scaler, medians)

            # Get cluster assignments as labels
            assignments = self.clustering_repo.get_assignments_for_run(clustering_run.id)
            record_id_to_label = {a.student_record_id: a.cluster_label for a in assignments}
            record_ids = [r.id for r in records]
            y = [record_id_to_label.get(rid, 0) for rid in record_ids]

            # Train
            config = model.training_config or {}
            trained_model, X_train, X_test, y_train, y_test = train_model(X, y, config)

            # Evaluate
            metrics = evaluate_model(trained_model, X_test, y_test)
            metrics["n_train_samples"] = len(X_train)

            # Save artifact
            artifact_dir = settings.get_artifacts_dir()
            artifact_filename = f"model_{model_id}_{uuid.uuid4().hex[:8]}.joblib"
            artifact_path = os.path.join(artifact_dir, artifact_filename)
            save_model_artifact(artifact_path, trained_model, scaler, medians, config)

            self.model_repo.update(
                model_id,
                status=ModelStatus.ready.value,
                metrics=metrics,
                artifact_path=artifact_path,
            )

        except Exception as e:
            self.model_repo.update(
                model_id,
                status=ModelStatus.failed.value,
                metrics={"error": str(e)},
            )

    def set_ready(self, model_id: int) -> Any:
        model = self.get_model(model_id)
        if not model.artifact_path:
            raise HTTPException(status_code=400, detail="Model has no artifact, cannot set ready")
        return self.model_repo.update(model_id, status=ModelStatus.ready.value)

    def archive_model(self, model_id: int) -> Any:
        self.get_model(model_id)
        return self.model_repo.update(model_id, status=ModelStatus.archived.value)
