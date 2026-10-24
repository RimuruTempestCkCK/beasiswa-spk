from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user, check_role
from app.services.prediction_service import PredictionService
from app.schemas.prediction import PredictionCreateRequest, PredictionResponse

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.get("")
def list_predictions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = PredictionService(db)
    return service.list_predictions(page=page, page_size=page_size)


@router.post("", response_model=PredictionResponse)
def create_prediction(
    payload: PredictionCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin", "operator")),
):
    service = PredictionService(db)
    return service.predict(
        model_version_id=payload.model_version_id,
        ipk=payload.ipk,
        parent_income=payload.parent_income,
        family_dependents=payload.family_dependents,
        academic_achievement_score=payload.academic_achievement_score,
        nonacademic_achievement_score=payload.nonacademic_achievement_score,
        attendance_percentage=payload.attendance_percentage,
        notes=payload.notes,
        created_by=current_user.id,
    )


@router.delete("/{prediction_id}")
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin", "operator")),
):
    service = PredictionService(db)
    service.delete_prediction(prediction_id)
    return {"message": f"Prediction #{prediction_id} successfully deleted", "id": prediction_id}
