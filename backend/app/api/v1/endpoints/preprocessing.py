from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user, check_role
from app.services.preprocessing_service import PreprocessingService
from app.schemas.preprocessing import PreprocessingRunCreateRequest, PreprocessingRunResponse
from app.jobs.job_runner import enqueue_job

router = APIRouter(prefix="/preprocessing", tags=["Preprocessing"])


@router.get("/runs")
def list_runs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = PreprocessingService(db)
    return service.list_runs(page=page, page_size=page_size)


@router.post("/runs", response_model=PreprocessingRunResponse)
def create_preprocessing_run(
    payload: PreprocessingRunCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin", "operator")),
):
    service = PreprocessingService(db)
    run = service.create_run(
        dataset_batch_id=payload.dataset_batch_id,
        method_version=payload.method_version or "v1.0",
        config=payload.config,
        created_by=current_user.id,
    )
    # Background execution
    enqueue_job(background_tasks, service.execute_run, run.id)
    return run


@router.get("/runs/{run_id}", response_model=PreprocessingRunResponse)
def get_preprocessing_run(
    run_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = PreprocessingService(db)
    return service.get_run(run_id)
