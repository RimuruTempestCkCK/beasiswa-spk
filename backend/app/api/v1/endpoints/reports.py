import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, Response, Query, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.core.security import get_current_user, decode_token
from app.models.dataset import DatasetBatch
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


def get_status_recommendation(c_label: int, confidence: Optional[float] = None) -> tuple[str, float]:
    """Helper to convert cluster number into human decision text & rank score."""
    conf = float(confidence or 0.85)
    if c_label == 2:
        return "SANGAT LAYAK (Prioritas Utama)", round(85.0 + conf * 15.0, 2)
    elif c_label == 1:
        return "LAYAK (Kandidat Cadangan)", round(70.0 + conf * 15.0, 2)
    elif c_label == 3:
        return "DIPERTIMBANGKAN", round(55.0 + conf * 15.0, 2)
    else:
        return "TIDAK LAYAK", round(35.0 + conf * 15.0, 2)


@router.get("/experiments")
def get_experiments_report(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Comprehensive summary list of all pipeline runs across batches, clustering, models, and scholarship recommendations."""
    batches = db.query(DatasetBatch).all()
    models = db.query(ModelVersion).order_by(desc(ModelVersion.id)).all()
    clusters = db.query(ClusteringRun).order_by(desc(ClusteringRun.id)).all()

    # Active model
    active_cluster = db.query(ClusteringRun).filter(ClusteringRun.is_selected == True).first()
    if not active_cluster and clusters:
        active_cluster = clusters[0]

    # Hasil rekomendasi beasiswa murni dari data prediksi kandidat yang telah diuji sistem
    predictions = db.query(Prediction).order_by(desc(Prediction.created_at)).all()
    prediction_rankings = []
    for p in predictions:
        status_text, score = get_status_recommendation(p.predicted_cluster, p.confidence_score)
        prediction_rankings.append({
            "id": p.id,
            "student_name": p.student_name,
            "student_code": p.student_code,
            "ipk": float(p.ipk),
            "parent_income": float(p.parent_income),
            "family_dependents": p.family_dependents,
            "academic_achievement_score": float(p.academic_achievement_score),
            "nonacademic_achievement_score": float(p.nonacademic_achievement_score),
            "attendance_percentage": float(p.attendance_percentage),
            "predicted_cluster": p.predicted_cluster,
            "confidence_score": float(p.confidence_score) if p.confidence_score is not None else None,
            "status_recommendation": status_text,
            "score_recommendation": score,
            "notes": p.notes,
            "created_at": p.created_at,
        })

    # Sort descending by recommendation score
    prediction_rankings.sort(key=lambda x: x["score_recommendation"], reverse=True)

    return {
        "batches_count": len(batches),
        "clustering_runs_count": len(clusters),
        "model_versions_count": len(models),
        "predictions_count": len(predictions),
        "active_clustering_run_id": active_cluster.id if active_cluster else None,
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
        "scholarship_recommendations": prediction_rankings,
    }


@router.get("/export/predictions")
@router.get("/export/rankings")
def export_predictions_csv(db: Session = Depends(get_db), current_user=Depends(get_current_user_allow_query)):
    """Export all actual scholarship candidate inference results into CSV format."""
    predictions = db.query(Prediction).order_by(desc(Prediction.created_at)).all()

    items = []
    for p in predictions:
        status_text, score = get_status_recommendation(p.predicted_cluster, p.confidence_score)
        items.append({
            "id": p.id,
            "student_name": p.student_name or "-",
            "student_code": p.student_code or "-",
            "ipk": float(p.ipk),
            "parent_income": float(p.parent_income),
            "family_dependents": p.family_dependents,
            "academic": float(p.academic_achievement_score),
            "nonacademic": float(p.nonacademic_achievement_score),
            "attendance": float(p.attendance_percentage),
            "cluster": f"C{p.predicted_cluster}",
            "confidence": f"{(float(p.confidence_score)*100):.2f}%" if p.confidence_score else "-",
            "status": status_text,
            "score": score,
            "notes": p.notes or "-",
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else "-",
        })

    # Sort descending by recommendation score
    items.sort(key=lambda x: x["score"], reverse=True)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Peringkat", "ID Uji", "Nama Mahasiswa", "NIM / Kode", "IPK", "Penghasilan Ortu (Rp)", "Tanggungan",
        "Prestasi Akademik", "Prestasi Non-Akademik", "Kehadiran (%)",
        "Klaster Hasil", "Confidence Score", "Rekomendasi Keputusan", "Skor SPK",
        "Keterangan / Catatan", "Waktu Inferensi"
    ])

    for rank, item in enumerate(items, 1):
        writer.writerow([
            rank, f"#{item['id']}", item["student_name"], item["student_code"],
            item["ipk"], int(item["parent_income"]),
            item["family_dependents"], item["academic"], item["nonacademic"],
            item["attendance"], item["cluster"], item["confidence"],
            item["status"], item["score"], item["notes"], item["created_at"]
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=laporan_rekomendasi_penerima_beasiswa.csv"}
    )
