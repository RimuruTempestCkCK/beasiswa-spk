from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user, check_role
from app.repositories.dataset_repo import DatasetRepository
from app.schemas.dataset import RecordCreateRequest, RecordUpdateRequest, RecordResponse

router = APIRouter(prefix="/records", tags=["Student Records"])


@router.get("")
def list_records(
    dataset_batch_id: Optional[int] = Query(None),
    dataset_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    target_batch_id = dataset_id if dataset_id is not None else dataset_batch_id
    repo = DatasetRepository(db)
    skip = (page - 1) * page_size
    total, items = repo.list_records(
        dataset_batch_id=target_batch_id,
        data_status=status,
        skip=skip,
        limit=page_size,
        search=search,
    )
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": r.id,
                "dataset_batch_id": r.dataset_batch_id,
                "dataset_id": r.dataset_batch_id,
                "student_code": r.student_code,
                "nim": r.student_code,
                "student_name": r.student_name,
                "nama": r.student_name,
                "ipk": float(r.ipk) if r.ipk is not None else None,
                "parent_income": float(r.parent_income) if r.parent_income is not None else None,
                "penghasilan_ortu": float(r.parent_income) if r.parent_income is not None else None,
                "family_dependents": r.family_dependents,
                "jumlah_tanggungan": r.family_dependents,
                "academic_achievement_score": float(r.academic_achievement_score) if r.academic_achievement_score is not None else None,
                "skor_prestasi_akademik": float(r.academic_achievement_score) if r.academic_achievement_score is not None else None,
                "nonacademic_achievement_score": float(r.nonacademic_achievement_score) if r.nonacademic_achievement_score is not None else None,
                "skor_prestasi_nonakademik": float(r.nonacademic_achievement_score) if r.nonacademic_achievement_score is not None else None,
                "attendance_percentage": float(r.attendance_percentage) if r.attendance_percentage is not None else None,
                "persentase_kehadiran": float(r.attendance_percentage) if r.attendance_percentage is not None else None,
                "data_status": r.data_status,
                "validation_notes": r.validation_notes,
                "created_at": r.created_at,
            }
            for r in items
        ],
    }


@router.post("", response_model=RecordResponse)
def create_record(
    payload: RecordCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin", "operator")),
):
    repo = DatasetRepository(db)
    data = {
        "dataset_batch_id": payload.dataset_batch_id,
        "student_code": payload.student_code,
        "student_name": payload.student_name,
        "ipk": payload.ipk,
        "parent_income": payload.parent_income,
        "family_dependents": payload.family_dependents,
        "academic_achievement_score": payload.academic_achievement_score,
        "nonacademic_achievement_score": payload.nonacademic_achievement_score,
        "attendance_percentage": payload.attendance_percentage,
    }
    record = repo.create_record(**data)
    return record


@router.get("/{record_id}", response_model=RecordResponse)
def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = DatasetRepository(db)
    rec = repo.get_record_by_id(record_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Student record not found")
    return rec


@router.patch("/{record_id}", response_model=RecordResponse)
def update_record(
    record_id: int,
    payload: RecordUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin", "operator")),
):
    repo = DatasetRepository(db)
    fields = [
        "student_code", "student_name", "ipk", "parent_income",
        "family_dependents", "academic_achievement_score",
        "nonacademic_achievement_score", "attendance_percentage"
    ]
    raw_dict = payload.dict()
    update_data = {k: raw_dict[k] for k in fields if raw_dict.get(k) is not None}
    rec = repo.update_record(record_id, **update_data)
    if not rec:
        raise HTTPException(status_code=404, detail="Student record not found")
    return rec


@router.delete("/{record_id}")
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(check_role("admin", "operator")),
):
    repo = DatasetRepository(db)
    ok = repo.delete_record(record_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Student record not found")
    return {"message": "Record deleted successfully"}
