from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user, check_role
from app.services.clustering_service import ClusteringService
from app.schemas.clustering import ClusteringRunCreateRequest, ClusteringRunResponse
from app.jobs.job_runner import enqueue_job

router = APIRouter(prefix="/clustering", tags=["Clustering"])


@router.get("/runs")
def list_runs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ClusteringService(db)
    return service.list_runs(page=page, page_size=page_size)


@router.post("/runs")
def create_clustering_runs(
    payload: ClusteringRunCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin", "operator")),
):
    service = ClusteringService(db)
    runs = service.create_runs(
        preprocessing_run_id=payload.preprocessing_run_id,
        k_values=payload.k_values,
        random_seed=payload.random_seed or 42,
        config=payload.config,
    )
    # Background execution for created runs
    run_ids = [r.id for r in runs]
    enqueue_job(background_tasks, service.execute_runs, run_ids)
    return {"message": f"Clustering runs initialized for k={payload.k_values}", "run_ids": run_ids}


@router.get("/runs/{run_id}", response_model=ClusteringRunResponse)
def get_clustering_run(
    run_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ClusteringService(db)
    return service.get_run(run_id)


@router.post("/runs/{run_id}/select")
def select_clustering_run(
    run_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin", "operator")),
):
    service = ClusteringService(db)
    run = service.select_run(run_id)
    return {"message": f"Clustering run {run_id} marked as selected reference", "run": run}


@router.get("/runs/{run_id}/assignments")
def get_run_assignments(
    run_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ClusteringService(db)
    return service.get_assignments(run_id=run_id, page=page, page_size=page_size)


@router.get("/runs/{run_id}/profile")
def get_run_profile(
    run_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = ClusteringService(db)
    return service.get_profile(run_id=run_id)
