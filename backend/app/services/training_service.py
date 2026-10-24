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

            # Get records and raw dataframe
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
            df_raw = pd.DataFrame(data)

            # Get cluster assignments as labels
            assignments = self.clustering_repo.get_assignments_for_run(clustering_run.id)
            record_id_to_label = {a.student_record_id: a.cluster_label for a in assignments}
            record_ids = [r.id for r in records]
            y = np.array([record_id_to_label.get(rid, 0) for rid in record_ids])

            # Split RAW data into Train and Test before fitting scaler to eliminate Data Leakage
            config = model.training_config or {}
            test_size = config.get("test_size", 0.2)
            random_state = config.get("random_state", 42)

            from sklearn.model_selection import train_test_split
            unique_classes = np.unique(y)
            stratify = y if len(unique_classes) > 1 and len(y) * test_size >= len(unique_classes) else None

            train_idx, test_idx = train_test_split(
                np.arange(len(df_raw)),
                test_size=test_size,
                random_state=random_state,
                stratify=stratify,
            )

            df_train = df_raw.iloc[train_idx].reset_index(drop=True)
            df_test = df_raw.iloc[test_idx].reset_index(drop=True)
            y_train = y[train_idx]
            y_test = y[test_idx]

            # Fit preprocessing ONLY on training data
            from app.ml.preprocessing import preprocess_train, preprocess_transform
            X_train, train_scaler, train_medians = preprocess_train(df_train)

            # Transform test data using training statistics (NO fitting on test data)
            X_test = preprocess_transform(df_test, train_scaler, train_medians)

            # Train MLP on strictly training set
            from sklearn.neural_network import MLPClassifier
            hidden_layers = tuple(config.get("hidden_layer_sizes", [64, 32]))
            trained_model = MLPClassifier(
                hidden_layer_sizes=hidden_layers,
                learning_rate_init=config.get("learning_rate_init", 0.001),
                max_iter=config.get("max_iter", 500),
                random_state=random_state,
                activation=config.get("activation", "relu"),
                early_stopping=True,
                validation_fraction=0.1,
                n_iter_no_change=20,
            )
            trained_model.fit(X_train, y_train)

            # Evaluate on test set
            metrics = evaluate_model(trained_model, X_test, y_test)
            metrics["n_train_samples"] = len(X_train)
            metrics["n_test_samples"] = len(X_test)
            metrics["leakage_free_validation"] = True

            # Save artifact (model + scaler and medians fitted strictly on train data)
            artifact_dir = settings.get_artifacts_dir()
            artifact_filename = f"model_{model_id}_{uuid.uuid4().hex[:8]}.joblib"
            artifact_path = os.path.join(artifact_dir, artifact_filename)
            save_model_artifact(artifact_path, trained_model, train_scaler, train_medians, config)

            # Atomic single active model activation: set new ready model as single ready/active model
            self.model_repo.set_single_ready(model_id, metrics=metrics, artifact_path=artifact_path)

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
        return self.model_repo.set_single_ready(model_id)

    def archive_model(self, model_id: int) -> Any:
        self.get_model(model_id)
        return self.model_repo.update(model_id, status=ModelStatus.archived.value)

    def get_active_model(self) -> ModelVersion:
        active = self.model_repo.get_active_model()
        if not active:
            raise HTTPException(
                status_code=404,
                detail="Belum ada model aktif berstatus 'ready'. Silakan latih atau aktifkan model terlebih dahulu.",
            )
        return active
