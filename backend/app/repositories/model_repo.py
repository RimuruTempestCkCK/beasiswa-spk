from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models.model_version import ModelVersion, ModelStatus


class ModelRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, model_id: int) -> Optional[ModelVersion]:
        return self.db.query(ModelVersion).filter(ModelVersion.id == model_id).first()

    def list_models(self, skip: int = 0, limit: int = 20) -> Tuple[int, List[ModelVersion]]:
        total = self.db.query(ModelVersion).count()
        items = (
            self.db.query(ModelVersion)
            .order_by(ModelVersion.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return total, items

    def create(self, **kwargs) -> ModelVersion:
        model = ModelVersion(**kwargs)
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return model

    def update(self, model_id: int, **kwargs) -> Optional[ModelVersion]:
        model = self.get_by_id(model_id)
        if not model:
            return None
        for key, value in kwargs.items():
            if hasattr(model, key):
                setattr(model, key, value)
        self.db.commit()
        self.db.refresh(model)
        return model

    def get_ready_models(self) -> List[ModelVersion]:
        return (
            self.db.query(ModelVersion)
            .filter(ModelVersion.status == ModelStatus.ready)
            .order_by(ModelVersion.created_at.desc(), ModelVersion.id.desc())
            .all()
        )

    def get_active_model(self) -> Optional[ModelVersion]:
        """
        Return the single active model (status='ready'), deterministically by latest created_at.
        """
        return (
            self.db.query(ModelVersion)
            .filter(ModelVersion.status == ModelStatus.ready)
            .order_by(ModelVersion.created_at.desc(), ModelVersion.id.desc())
            .first()
        )

    def set_single_ready(self, model_id: int, **kwargs) -> Optional[ModelVersion]:
        """
        Atomically set one model as ready, and archive previous ready models.
        """
        target = self.get_by_id(model_id)
        if not target:
            return None

        # Archive other ready models
        self.db.query(ModelVersion).filter(
            ModelVersion.status == ModelStatus.ready,
            ModelVersion.id != model_id
        ).update({"status": ModelStatus.archived.value}, synchronize_session=False)

        target.status = ModelStatus.ready.value
        for key, value in kwargs.items():
            if hasattr(target, key):
                setattr(target, key, value)

        self.db.commit()
        self.db.refresh(target)
        return target
