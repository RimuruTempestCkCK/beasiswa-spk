from typing import Callable, Any
from fastapi import BackgroundTasks
import logging

logger = logging.getLogger("beasiswa_spk.jobs")


def enqueue_job(background_tasks: BackgroundTasks, func: Callable, *args: Any, **kwargs: Any):
    """
    Enqueues a background job using FastAPI BackgroundTasks for MVP execution.
    Logs lifecycle and catches uncaught errors.
    """
    def _runner():
        job_name = getattr(func, "__name__", str(func))
        logger.info(f"Starting background job: {job_name}")
        try:
            func(*args, **kwargs)
            logger.info(f"Finished background job: {job_name}")
        except Exception as e:
            logger.error(f"Error in background job {job_name}: {e}", exc_info=True)

    background_tasks.add_task(_runner)
