import os
import uuid
import pandas as pd
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories.preprocessing_repo import PreprocessingRepository
from app.repositories.dataset_repo import DatasetRepository
from app.models.preprocessing import RunStatus
from app.ml.preprocessing import preprocess_train, save_preprocessing_artifact
from app.ml.data_validation import REQUIRED_FEATURES


class PreprocessingService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PreprocessingRepository(db)
        self.dataset_repo = DatasetRepository(db)

    def list_runs(self, page: int = 1, page_size: int = 20) -> dict:
        skip = (page - 1) * page_size
        total, items = self.repo.list_runs(skip=skip, limit=page_size)
        return {"total": total, "page": page, "page_size": page_size, "items": items}

    def get_run(self, run_id: int):
        run = self.repo.get_by_id(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Preprocessing run not found")
        return run

    def create_run(
        self,
        dataset_batch_id: int,
        method_version: str,
        config: Optional[Dict[str, Any]],
        created_by: Optional[int],
    ):
        batch = self.dataset_repo.get_batch_by_id(dataset_batch_id)
        if not batch:
            raise HTTPException(status_code=404, detail="Dataset batch not found")

        run = self.repo.create(
            dataset_batch_id=dataset_batch_id,
            method_version=method_version,
            config=config or {},
            status=RunStatus.queued.value,
            created_by=created_by,
        )
        return run

    def execute_run(self, run_id: int) -> None:
        """Execute preprocessing synchronously (called from BackgroundTasks)."""
        run = self.repo.get_by_id(run_id)
        if not run:
            return

        self.repo.update(run_id, status=RunStatus.running.value, started_at=datetime.now())

        try:
            records = self.dataset_repo.get_records_for_batch(run.dataset_batch_id)
            if not records:
                raise ValueError("No student records found for this batch")

            # Build DataFrame from records
            data = []
            for r in records:
                data.append({
                    "id": r.id,
                    "ipk": float(r.ipk) if r.ipk is not None else None,
                    "parent_income": float(r.parent_income) if r.parent_income is not None else None,
                    "family_dependents": float(r.family_dependents) if r.family_dependents is not None else None,
                    "academic_achievement_score": float(r.academic_achievement_score) if r.academic_achievement_score is not None else None,
                    "nonacademic_achievement_score": float(r.nonacademic_achievement_score) if r.nonacademic_achievement_score is not None else None,
                    "attendance_percentage": float(r.attendance_percentage) if r.attendance_percentage is not None else None,
                })
            df = pd.DataFrame(data)
            input_rows = len(df)

            X_normalized, scaler, medians = preprocess_train(df)
            output_rows = len(X_normalized)

            # Save artifact
            artifact_dir = settings.get_artifacts_dir()
            artifact_filename = f"preprocessing_{run_id}_{uuid.uuid4().hex[:8]}.joblib"
            artifact_path = os.path.join(artifact_dir, artifact_filename)

            config_to_save = run.config or {}
            config_to_save["medians"] = medians

            save_preprocessing_artifact(artifact_path, scaler, medians, config_to_save)

            self.repo.update(
                run_id,
                status=RunStatus.completed.value,
                input_rows=input_rows,
                output_rows=output_rows,
                artifact_path=artifact_path,
                config=config_to_save,
                completed_at=datetime.now(),
            )

        except Exception as e:
            self.repo.update(
                run_id,
                status=RunStatus.failed.value,
                error_message=str(e),
                completed_at=datetime.now(),
            )
