from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user, check_role
from app.services.dataset_service import DatasetService
from app.schemas.dataset import BatchCreateRequest, BatchResponse

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.get("")
def list_batches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = DatasetService(db)
    return service.list_batches(page=page, page_size=page_size)


@router.post("", response_model=BatchResponse)
def create_batch(
    payload: BatchCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin", "operator")),
):
    service = DatasetService(db)
    return service.create_batch(
        batch_name=payload.batch_name or payload.name,
        source_type=payload.source_type,
        description=payload.dataset_description or payload.description,
        created_by=current_user.id,
    )


@router.get("/{batch_id}", response_model=BatchResponse)
def get_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = DatasetService(db)
    return service.get_batch(batch_id)


@router.delete("/{batch_id}")
def delete_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin")),
):
    service = DatasetService(db)
    service.delete_batch(batch_id)
    return {"message": "Dataset batch deleted successfully"}


@router.post("/{batch_id}/import")
def import_dataset(
    batch_id: int,
    file: UploadFile = File(...),
    preview_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin", "operator")),
):
    service = DatasetService(db)
    return service.import_file(
        batch_id=batch_id,
        file=file,
        created_by=current_user.id,
        preview_only=preview_only,
    )


@router.get("/{batch_id}/preview")
def preview_dataset(
    batch_id: int,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = DatasetService(db)
    return service.get_preview(batch_id=batch_id, limit=limit)


@router.get("/{batch_id}/validation")
def validation_summary(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = DatasetService(db)
    return service.get_validation(batch_id=batch_id)
