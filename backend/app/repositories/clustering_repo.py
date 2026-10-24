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
