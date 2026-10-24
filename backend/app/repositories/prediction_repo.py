from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models.prediction import Prediction


class PredictionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, prediction_id: int) -> Optional[Prediction]:
        return self.db.query(Prediction).filter(Prediction.id == prediction_id).first()

    def list_predictions(self, skip: int = 0, limit: int = 20) -> Tuple[int, List[Prediction]]:
        total = self.db.query(Prediction).count()
        items = (
            self.db.query(Prediction)
            .order_by(Prediction.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return total, items

    def create(self, **kwargs) -> Prediction:
        prediction = Prediction(**kwargs)
        self.db.add(prediction)
        self.db.commit()
        self.db.refresh(prediction)
        return prediction

    def delete(self, prediction_id: int) -> bool:
        pred = self.get_by_id(prediction_id)
        if pred:
            self.db.delete(pred)
            self.db.commit()
            return True
        return False

    def get_all_for_export(self) -> List[Prediction]:
        return self.db.query(Prediction).order_by(Prediction.created_at.desc()).all()
