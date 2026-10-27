from typing import Optional, List
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories.prediction_repo import PredictionRepository
from app.repositories.model_repo import ModelRepository
from app.models.model_version import ModelStatus
from app.ml.inference import predict_single
from app.ml.data_validation import REQUIRED_FEATURES


class PredictionService:
    def __init__(self, db: Session):
        self.db = db
        self.prediction_repo = PredictionRepository(db)
        self.model_repo = ModelRepository(db)

    def list_predictions(self, page: int = 1, page_size: int = 20) -> dict:
        skip = (page - 1) * page_size
        total, items = self.prediction_repo.list_predictions(skip=skip, limit=page_size)
        return {"total": total, "page": page, "page_size": page_size, "items": items}

    def delete_prediction(self, prediction_id: int) -> bool:
        pred = self.prediction_repo.get_by_id(prediction_id)
        if not pred:
            raise HTTPException(status_code=404, detail="Prediction record not found")
        return self.prediction_repo.delete(prediction_id)

    def predict(
        self,
        model_version_id: Optional[int],
        student_name: Optional[str],
        student_code: Optional[str],
        ipk: float,
        parent_income: float,
        family_dependents: int,
        academic_achievement_score: float,
        nonacademic_achievement_score: float,
        attendance_percentage: float,
        notes: Optional[str],
        created_by: Optional[int],
    ):
        # Resolve target model: use provided ID or resolve active model deterministically
        if model_version_id:
            model = self.model_repo.get_by_id(model_version_id)
        else:
            model = self.model_repo.get_active_model()

        if not model:
            raise HTTPException(
                status_code=404,
                detail="Model version not found or no active model currently available in 'ready' status"
            )
        if model.status != ModelStatus.ready.value:
            raise HTTPException(status_code=400, detail="Model is not in 'ready' status")
        if not model.artifact_path:
            raise HTTPException(status_code=400, detail="Model artifact not found")

        features = {
            "ipk": ipk,
            "parent_income": parent_income,
            "family_dependents": float(family_dependents),
            "academic_achievement_score": academic_achievement_score,
            "nonacademic_achievement_score": nonacademic_achievement_score,
            "attendance_percentage": attendance_percentage,
        }

        predicted_cluster, confidence_score = predict_single(model.artifact_path, features)

        prediction = self.prediction_repo.create(
            model_version_id=model.id,
            student_name=student_name,
            student_code=student_code,
            ipk=ipk,
            parent_income=parent_income,
            family_dependents=family_dependents,
            academic_achievement_score=academic_achievement_score,
            nonacademic_achievement_score=nonacademic_achievement_score,
            attendance_percentage=attendance_percentage,
            predicted_cluster=predicted_cluster,
            confidence_score=confidence_score,
            notes=notes,
            created_by=created_by,
        )
        return prediction

    def get_all_for_export(self) -> List[dict]:
        predictions = self.prediction_repo.get_all_for_export()
        return [
            {
                "id": p.id,
                "model_version_id": p.model_version_id,
                "student_name": p.student_name,
                "student_code": p.student_code,
                "ipk": float(p.ipk),
                "parent_income": float(p.parent_income),
                "family_dependents": p.family_dependents,
                "academic_achievement_score": float(p.academic_achievement_score),
                "nonacademic_achievement_score": float(p.nonacademic_achievement_score),
                "attendance_percentage": float(p.attendance_percentage),
                "predicted_cluster": p.predicted_cluster,
                "confidence_score": float(p.confidence_score) if p.confidence_score else None,
                "notes": p.notes,
                "created_by": p.created_by,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in predictions
        ]
