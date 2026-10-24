from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models.clustering import ClusteringRun, ClusterAssignment


class ClusteringRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_run_by_id(self, run_id: int) -> Optional[ClusteringRun]:
        return self.db.query(ClusteringRun).filter(ClusteringRun.id == run_id).first()

    def list_runs(self, skip: int = 0, limit: int = 20) -> Tuple[int, List[ClusteringRun]]:
        total = self.db.query(ClusteringRun).count()
        items = (
            self.db.query(ClusteringRun)
            .order_by(ClusteringRun.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return total, items

    def create_run(self, **kwargs) -> ClusteringRun:
        run = ClusteringRun(**kwargs)
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def update_run(self, run_id: int, **kwargs) -> Optional[ClusteringRun]:
        run = self.get_run_by_id(run_id)
        if not run:
            return None
        for key, value in kwargs.items():
            if hasattr(run, key):
                setattr(run, key, value)
        self.db.commit()
        self.db.refresh(run)
        return run

    def deselect_all_for_preprocessing(self, preprocessing_run_id: int) -> None:
        """Deselect all clustering runs for a given preprocessing run."""
        self.db.query(ClusteringRun).filter(
            ClusteringRun.preprocessing_run_id == preprocessing_run_id,
        ).update({"is_selected": False})
        self.db.commit()

    def bulk_create_assignments(self, assignments: List[dict]) -> int:
        self.db.bulk_insert_mappings(ClusterAssignment, assignments)
        self.db.commit()
        return len(assignments)

    def get_assignments_for_run(self, clustering_run_id: int) -> List[ClusterAssignment]:
        return (
            self.db.query(ClusterAssignment)
            .filter(ClusterAssignment.clustering_run_id == clustering_run_id)
            .all()
        )

    def get_assignments_with_details(self, clustering_run_id: int) -> List[dict]:
        from app.models.dataset import StudentRecord
        rows = (
            self.db.query(ClusterAssignment, StudentRecord)
            .join(StudentRecord, ClusterAssignment.student_record_id == StudentRecord.id)
            .filter(ClusterAssignment.clustering_run_id == clustering_run_id)
            .all()
        )
        return [
            {
                "id": a.id,
                "clustering_run_id": a.clustering_run_id,
                "student_record_id": a.student_record_id,
                "cluster_label": a.cluster_label,
                "cluster": a.cluster_label,
                "distance_to_centroid": float(a.distance_to_centroid) if a.distance_to_centroid is not None else None,
                "distance": float(a.distance_to_centroid) if a.distance_to_centroid is not None else None,
                "nim": r.student_code,
                "nama": r.student_name,
                "student_code": r.student_code,
                "student_name": r.student_name,
            }
            for a, r in rows
        ]
