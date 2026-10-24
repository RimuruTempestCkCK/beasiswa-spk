import os
import uuid
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories.clustering_repo import ClusteringRepository
from app.repositories.preprocessing_repo import PreprocessingRepository
from app.repositories.dataset_repo import DatasetRepository
from app.models.clustering import ClusteringStatus
from app.ml.preprocessing import load_preprocessing_artifact, preprocess_transform
from app.ml.clustering import (
    run_kmeans, run_kmeans_multiple_k, compute_cluster_profiles,
    save_clustering_artifact,
)
from app.ml.data_validation import REQUIRED_FEATURES


class ClusteringService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ClusteringRepository(db)
        self.preprocess_repo = PreprocessingRepository(db)
        self.dataset_repo = DatasetRepository(db)

    def list_runs(self, page: int = 1, page_size: int = 20) -> dict:
        skip = (page - 1) * page_size
        total, items = self.repo.list_runs(skip=skip, limit=page_size)
        return {"total": total, "page": page, "page_size": page_size, "items": items}

    def get_run(self, run_id: int):
        run = self.repo.get_run_by_id(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Clustering run not found")
        return run

    def create_runs(
        self,
        preprocessing_run_id: int,
        k_values: List[int],
        random_seed: int,
        config: Optional[Dict[str, Any]],
    ) -> List[Any]:
        prep_run = self.preprocess_repo.get_by_id(preprocessing_run_id)
        if not prep_run:
            raise HTTPException(status_code=404, detail="Preprocessing run not found")
        if prep_run.status != "completed":
            raise HTTPException(status_code=400, detail="Preprocessing run is not completed")

        runs = []
        for k in k_values:
            run = self.repo.create_run(
                preprocessing_run_id=preprocessing_run_id,
                algorithm="KMeans",
                k_value=k,
                random_seed=random_seed,
                config=config or {},
                status=ClusteringStatus.queued.value,
                is_selected=False,
            )
            runs.append(run)
        return runs

    def execute_runs(self, run_ids: List[int]) -> None:
        """Execute clustering for multiple runs (background task)."""
        if not run_ids:
            return

        # Load preprocessing artifact once
        first_run = self.repo.get_run_by_id(run_ids[0])
        if not first_run:
            return

        prep_run = self.preprocess_repo.get_by_id(first_run.preprocessing_run_id)
        if not prep_run or not prep_run.artifact_path:
            for run_id in run_ids:
                self.repo.update_run(run_id, status=ClusteringStatus.failed.value, dbi_score=None)
            return

        try:
            artifact = load_preprocessing_artifact(prep_run.artifact_path)
            scaler = artifact["scaler"]
            medians = artifact["medians"]

            # Get records for the batch
            records = self.dataset_repo.get_records_for_batch(prep_run.dataset_batch_id)
            record_ids = [r.id for r in records]

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

        except Exception as e:
            for run_id in run_ids:
                self.repo.update_run(run_id, status=ClusteringStatus.failed.value)
            return

        for run_id in run_ids:
            run = self.repo.get_run_by_id(run_id)
            if not run:
                continue
            self.repo.update_run(run_id, status=ClusteringStatus.running.value)
            try:
                result = run_kmeans(X, run.k_value, random_seed=run.random_seed or 42)

                # Save artifact
                artifact_dir = settings.get_artifacts_dir()
                artifact_filename = f"clustering_{run_id}_{uuid.uuid4().hex[:8]}.joblib"
                artifact_path = os.path.join(artifact_dir, artifact_filename)
                save_clustering_artifact(artifact_path, result, run.k_value)

                # Save cluster assignments
                assignments = []
                for i, (label, dist) in enumerate(zip(result["labels"], result["distances"])):
                    if i < len(record_ids):
                        assignments.append({
                            "clustering_run_id": run_id,
                            "student_record_id": record_ids[i],
                            "cluster_label": int(label),
                            "distance_to_centroid": float(dist),
                        })
                if assignments:
                    self.repo.bulk_create_assignments(assignments)

                self.repo.update_run(
                    run_id,
                    status=ClusteringStatus.completed.value,
                    dbi_score=result["dbi_score"],
                    artifact_path=artifact_path,
                )
            except Exception as e:
                self.repo.update_run(run_id, status=ClusteringStatus.failed.value)

    def select_run(self, run_id: int) -> Any:
        run = self.get_run(run_id)
        if run.status != "completed":
            raise HTTPException(status_code=400, detail="Only completed clustering runs can be selected")

        # Deselect all runs for same preprocessing
        self.repo.deselect_all_for_preprocessing(run.preprocessing_run_id)
        return self.repo.update_run(run_id, is_selected=True)

    def get_assignments(self, run_id: int) -> List[Any]:
        self.get_run(run_id)
        return self.repo.get_assignments_for_run(run_id)

    def get_cluster_profile(self, run_id: int) -> List[dict]:
        run = self.get_run(run_id)
        if not run.artifact_path:
            raise HTTPException(status_code=400, detail="Clustering artifact not available")

        from app.ml.clustering import load_clustering_artifact
        artifact = load_clustering_artifact(run.artifact_path)
        result = artifact["result"]

        assignments = self.repo.get_assignments_for_run(run_id)
        labels = [a.cluster_label for a in assignments]

        # Load preprocessing artifact to get original X
        prep_run = self.preprocess_repo.get_by_id(run.preprocessing_run_id)
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
        artifact_prep = load_preprocessing_artifact(prep_run.artifact_path)
        X = preprocess_transform(df, artifact_prep["scaler"], artifact_prep["medians"])

        profiles = compute_cluster_profiles(X, labels, result["centroids"], REQUIRED_FEATURES)
        return profiles
