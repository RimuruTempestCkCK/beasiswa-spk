from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.dataset import DatasetBatch, StudentRecord
from app.models.clustering import ClusteringRun
from app.models.model_version import ModelVersion, ModelStatus

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Return high-level summary KPIs and metrics for Dashboard."""
    total_batches = db.query(DatasetBatch).count()
    total_records = db.query(StudentRecord).count()
    total_clustering_runs = db.query(ClusteringRun).count()
    active_models_count = db.query(ModelVersion).filter(ModelVersion.status == ModelStatus.ready.value).count()

    latest_batches = db.query(DatasetBatch).order_by(DatasetBatch.created_at.desc()).limit(5).all()
    latest_models = db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).limit(5).all()

    return {
        "kpis": {
            "total_batches": total_batches,
            "total_records": total_records,
            "total_clustering_experiments": total_clustering_runs,
            "active_ready_models": active_models_count,
        },
        "total_datasets": total_batches,
        "total_records": total_records,
        "total_clustering_runs": total_clustering_runs,
        "active_models": active_models_count,
        "latest_batches": [
            {
                "id": b.id,
                "batch_name": b.batch_name,
                "name": b.batch_name,
                "source_type": b.source_type,
                "total_rows": b.total_rows,
                "record_count": b.total_rows,
                "description": b.dataset_description,
                "status": b.status,
                "created_at": b.created_at,
            }
            for b in latest_batches
        ],
        "latest_models": [
            {
                "id": m.id,
                "model_name": m.model_name,
                "name": m.model_name,
                "model_version": m.model_version,
                "version": m.model_version,
                "status": m.status,
                "algorithm": m.algorithm,
                "accuracy": m.metrics.get("accuracy") if m.metrics else None,
                "created_at": m.created_at,
            }
            for m in latest_models
        ],
    }
