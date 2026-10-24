from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    dashboard,
    datasets,
    records,
    preprocessing,
    clustering,
    training,
    predictions,
    reports,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(datasets.router)
api_router.include_router(records.router)
api_router.include_router(preprocessing.router)
api_router.include_router(clustering.router)
api_router.include_router(training.router)
api_router.include_router(predictions.router)
api_router.include_router(reports.router)
api_router.include_router(users.router)
