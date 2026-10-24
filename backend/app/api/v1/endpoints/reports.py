import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, Response, Query, Header, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user, decode_token
from app.models.dataset import DatasetBatch
from app.models.preprocessing import PreprocessingRun
from app.models.clustering import ClusteringRun
from app.models.model_version import ModelVersion
from app.models.prediction import Prediction
from app.repositories.user_repo import UserRepository

router = APIRouter(prefix="/reports", tags=["Reports"])


def get_current_user_allow_query(
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    actual_token = None
    if authorization and authorization.startswith("Bearer "):
        actual_token = authorization.split(" ")[1]
    elif token:
        actual_token = token
    if not actual_token:
        raise HTTPException(status_code=401, detail="Authentication credentials required")
    payload = decode_token(actual_token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid token")
    repo = UserRepository(db)
    user = repo.get_by_id(int(payload.get("sub")))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User inactive or not found")
    return user


@router.get("/experiments")
def get_experiments_report(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Summary list of all pipeline runs across batches, preprocessing, clustering, and models."""
    batches = db.query(DatasetBatch).all()
    models = db.query(ModelVersion).all()
    clusters = db.query(ClusteringRun).all()

    return {
        "batches_count": len(batches),
        "clustering_runs_count": len(clusters),
        "model_versions_count": len(models),
        "models": [
            {
                "id": m.id,
                "name": m.model_name,
                "model_name": m.model_name,
                "version": m.model_version,
                "model_version": m.model_version,
                "status": m.status,
                "metrics": m.metrics,
                "accuracy": m.metrics.get("accuracy") if m.metrics else None,
                "target_clustering_run_id": m.target_clustering_run_id,
                "clustering_run_id": m.target_clustering_run_id,
                "created_at": m.created_at,
            }
            for m in models
        ],
        "clusters": [
            {
                "id": c.id,
                "preprocessing_run_id": c.preprocessing_run_id,
                "k_value": c.k_value,
                "k": c.k_value,
                "dbi_score": float(c.dbi_score) if c.dbi_score is not None else None,
                "status": c.status,
                "is_selected": c.is_selected,
                "created_at": c.created_at,
            }
            for c in clusters
        ],
    }


@router.get("/export/predictions")
def export_predictions_csv(db: Session = Depends(get_db), current_user=Depends(get_current_user_allow_query)):
    """Export all predictions into CSV format."""
    predictions = db.query(Prediction).order_by(Prediction.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "model_version_id", "ipk", "parent_income", "family_dependents",
        "academic_achievement_score", "nonacademic_achievement_score",
        "attendance_percentage", "predicted_cluster", "confidence_score",
        "notes", "created_at"
    ])

    for p in predictions:
        writer.writerow([
            p.id, p.model_version_id, float(p.ipk), float(p.parent_income),
            p.family_dependents, float(p.academic_achievement_score),
            float(p.nonacademic_achievement_score), float(p.attendance_percentage),
            p.predicted_cluster, float(p.confidence_score) if p.confidence_score is not None else "",
            p.notes or "", p.created_at
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=predictions_export.csv"}
    )
