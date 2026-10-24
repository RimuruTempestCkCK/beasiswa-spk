from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user, check_role
from app.services.training_service import TrainingService
from app.schemas.training import TrainingCreateRequest, ModelVersionResponse
from app.jobs.job_runner import enqueue_job

router = APIRouter(prefix="/models", tags=["Model Training & Evaluation"])


@router.get("")
def list_models(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = TrainingService(db)
    return service.list_models(page=page, page_size=page_size)


@router.post("/train", response_model=ModelVersionResponse)
def train_model(
    payload: TrainingCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin", "operator")),
):
    service = TrainingService(db)
    model = service.create_training(
        model_name=payload.model_name,
        model_version=payload.model_version,
        clustering_run_id=payload.clustering_run_id,
        config=payload.config,
        created_by=current_user.id,
    )
    # Background training execution
    enqueue_job(background_tasks, service.execute_training, model.id)
    return model


@router.get("/{model_id}", response_model=ModelVersionResponse)
def get_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = TrainingService(db)
    return service.get_model(model_id)


@router.post("/{model_id}/set-ready")
def set_model_ready(
    model_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin", "operator")),
):
    service = TrainingService(db)
    model = service.set_ready(model_id)
    return {"message": f"Model {model_id} status changed to ready", "model": model}


@router.post("/{model_id}/archive")
def archive_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin")),
):
    service = TrainingService(db)
    model = service.archive(model_id)
    return {"message": f"Model {model_id} archived", "model": model}
