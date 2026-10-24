from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all models here so Alembic can discover them
from app.models.user import User  # noqa: F401, E402
from app.models.dataset import DatasetBatch, StudentRecord  # noqa: F401, E402
from app.models.preprocessing import PreprocessingRun  # noqa: F401, E402
from app.models.clustering import ClusteringRun, ClusterAssignment  # noqa: F401, E402
from app.models.model_version import ModelVersion  # noqa: F401, E402
from app.models.prediction import Prediction  # noqa: F401, E402
from app.models.audit_log import AuditLog  # noqa: F401, E402
