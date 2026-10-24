from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models.preprocessing import PreprocessingRun, RunStatus


class PreprocessingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, run_id: int) -> Optional[PreprocessingRun]:
        return self.db.query(PreprocessingRun).filter(PreprocessingRun.id == run_id).first()

    def list_runs(self, skip: int = 0, limit: int = 20) -> Tuple[int, List[PreprocessingRun]]:
        total = self.db.query(PreprocessingRun).count()
        items = (
            self.db.query(PreprocessingRun)
            .order_by(PreprocessingRun.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return total, items

    def create(self, **kwargs) -> PreprocessingRun:
        run = PreprocessingRun(**kwargs)
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def update(self, run_id: int, **kwargs) -> Optional[PreprocessingRun]:
        run = self.get_by_id(run_id)
        if not run:
            return None
        for key, value in kwargs.items():
            if hasattr(run, key):
                setattr(run, key, value)
        self.db.commit()
        self.db.refresh(run)
        return run
