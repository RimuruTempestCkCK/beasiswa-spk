import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, Response, Query, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.core.security import get_current_user, decode_token
from app.models.dataset import DatasetBatch, StudentRecord
from app.models.preprocessing import PreprocessingRun
from app.models.clustering import ClusteringRun, ClusterAssignment
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
    """Comprehensive summary list of all pipeline runs across batches, clustering, models, and scholarship recommendations."""
    batches = db.query(DatasetBatch).all()
    models = db.query(ModelVersion).order_by(desc(ModelVersion.id)).all()
    clusters = db.query(ClusteringRun).order_by(desc(ClusteringRun.id)).all()

    # Find active reference clustering run
    active_cluster = db.query(ClusteringRun).filter(ClusteringRun.is_selected == True).first()
    if not active_cluster and clusters:
        active_cluster = clusters[0]

    # Map student rankings with decision status
    student_rankings = []
    if active_cluster:
        rows = (
            db.query(ClusterAssignment, StudentRecord)
            .join(StudentRecord, ClusterAssignment.student_record_id == StudentRecord.id)
            .filter(ClusterAssignment.clustering_run_id == active_cluster.id)
            .order_by(ClusterAssignment.cluster_label.desc(), ClusterAssignment.distance_to_centroid.asc())
            .all()
        )
        for a, s in rows:
            # Deterministic label mapping based on scholarship criteria
            # C2: Prioritas Utama, C1: Cadangan / Kuota Lanjutan, C3: Dipertimbangkan, C0: Tidak Direkomendasikan
            c_label = a.cluster_label
            if c_label == 2:
                status_text = "SANGAT LAYAK (Prioritas Utama)"
                rank_score = 95 - float(a.distance_to_centroid or 0.1) * 10
            elif c_label == 1:
                status_text = "LAYAK (Kandidat Cadangan)"
                rank_score = 80 - float(a.distance_to_centroid or 0.1) * 10
            elif c_label == 3:
                status_text = "DIPERTIMBANGKAN"
                rank_score = 65 - float(a.distance_to_centroid or 0.1) * 10
            else:
                status_text = "TIDAK LAYAK"
                rank_score = 45 - float(a.distance_to_centroid or 0.1) * 10

            student_rankings.append({
                "student_id": s.id,
                "nim": s.student_code,
                "name": s.student_name,
                "ipk": float(s.ipk) if s.ipk is not None else 0.0,
                "parent_income": float(s.parent_income) if s.parent_income is not None else 0.0,
                "family_dependents": s.family_dependents,
                "academic_score": float(s.academic_achievement_score or 0.0),
                "nonacademic_score": float(s.nonacademic_achievement_score or 0.0),
                "attendance": float(s.attendance_percentage or 0.0),
                "cluster": c_label,
                "distance": float(a.distance_to_centroid) if a.distance_to_centroid is not None else 0.0,
                "status_recommendation": status_text,
                "score_recommendation": round(max(0, rank_score), 2),
            })

    # Sort descending by recommendation score
    student_rankings.sort(key=lambda x: x["score_recommendation"], reverse=True)

    predictions = db.query(Prediction).order_by(desc(Prediction.created_at)).all()
    predictions_data = [
        {
            "id": p.id,
            "ipk": float(p.ipk),
            "parent_income": float(p.parent_income),
            "family_dependents": p.family_dependents,
            "academic_achievement_score": float(p.academic_achievement_score),
            "nonacademic_achievement_score": float(p.nonacademic_achievement_score),
            "attendance_percentage": float(p.attendance_percentage),
            "predicted_cluster": p.predicted_cluster,
            "confidence_score": float(p.confidence_score) if p.confidence_score is not None else None,
            "notes": p.notes,
            "created_at": p.created_at,
        }
        for p in predictions
    ]

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
        "student_rankings": student_rankings,
        "predictions": predictions_data,
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
        headers={"Content-Disposition": "attachment; filename=laporan_prediksi_beasiswa.csv"}
    )


@router.get("/export/rankings")
def export_rankings_csv(db: Session = Depends(get_db), current_user=Depends(get_current_user_allow_query)):
    """Export all student scholarship ranking recommendations into CSV format."""
    active_cluster = db.query(ClusteringRun).filter(ClusteringRun.is_selected == True).first()
    if not active_cluster:
        active_cluster = db.query(ClusteringRun).order_by(desc(ClusteringRun.id)).first()

    rows = []
    if active_cluster:
        rows = (
            db.query(ClusterAssignment, StudentRecord)
            .join(StudentRecord, ClusterAssignment.student_record_id == StudentRecord.id)
            .filter(ClusterAssignment.clustering_run_id == active_cluster.id)
            .order_by(ClusterAssignment.cluster_label.desc(), ClusterAssignment.distance_to_centroid.asc())
            .all()
        )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Peringkat", "NIM", "Nama Mahasiswa", "IPK", "Penghasilan Ortu (Rp)",
        "Tanggungan", "Prestasi Akademik", "Prestasi Non-Akademik",
        "Kehadiran (%)", "Klaster Hasil", "Jarak Euclidean", "Rekomendasi Keputusan", "Skor Rekomendasi"
    ])

    items = []
    for a, s in rows:
        c_label = a.cluster_label
        if c_label == 2:
            status_text = "SANGAT LAYAK (Prioritas Utama)"
            rank_score = 95 - float(a.distance_to_centroid or 0.1) * 10
        elif c_label == 1:
            status_text = "LAYAK (Kandidat Cadangan)"
            rank_score = 80 - float(a.distance_to_centroid or 0.1) * 10
        elif c_label == 3:
            status_text = "DIPERTIMBANGKAN"
            rank_score = 65 - float(a.distance_to_centroid or 0.1) * 10
        else:
            status_text = "TIDAK LAYAK"
            rank_score = 45 - float(a.distance_to_centroid or 0.1) * 10

        items.append({
            "nim": s.student_code,
            "nama": s.student_name,
            "ipk": float(s.ipk) if s.ipk is not None else 0.0,
            "income": float(s.parent_income) if s.parent_income is not None else 0.0,
            "dependents": s.family_dependents,
            "academic": float(s.academic_achievement_score or 0.0),
            "nonacademic": float(s.nonacademic_achievement_score or 0.0),
            "attendance": float(s.attendance_percentage or 0.0),
            "cluster": f"C{c_label}",
            "distance": float(a.distance_to_centroid) if a.distance_to_centroid is not None else 0.0,
            "status": status_text,
            "score": round(max(0, rank_score), 2),
        })

    items.sort(key=lambda x: x["score"], reverse=True)

    for rank, item in enumerate(items, 1):
        writer.writerow([
            rank, item["nim"], item["nama"], item["ipk"], int(item["income"]),
            item["dependents"], item["academic"], item["nonacademic"],
            item["attendance"], item["cluster"], round(item["distance"], 4),
            item["status"], item["score"]
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=laporan_rekomendasi_beasiswa_lengkap.csv"}
    )
