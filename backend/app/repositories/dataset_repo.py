from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.dataset import DatasetBatch, StudentRecord, BatchStatus, DataStatus


class DatasetRepository:
    def __init__(self, db: Session):
        self.db = db

    # --- DatasetBatch ---
    def get_batch_by_id(self, batch_id: int) -> Optional[DatasetBatch]:
        return self.db.query(DatasetBatch).filter(DatasetBatch.id == batch_id).first()

    def list_batches(self, skip: int = 0, limit: int = 20) -> Tuple[int, List[DatasetBatch]]:
        total = self.db.query(func.count(DatasetBatch.id)).scalar()
        items = self.db.query(DatasetBatch).order_by(DatasetBatch.created_at.desc()).offset(skip).limit(limit).all()
        return total, items

    def create_batch(self, batch_name: str, source_type: str, dataset_description: Optional[str], created_by: Optional[int]) -> DatasetBatch:
        batch = DatasetBatch(
            batch_name=batch_name,
            source_type=source_type,
            dataset_description=dataset_description,
            created_by=created_by,
        )
        self.db.add(batch)
        self.db.commit()
        self.db.refresh(batch)
        return batch

    def update_batch(self, batch_id: int, **kwargs) -> Optional[DatasetBatch]:
        batch = self.get_batch_by_id(batch_id)
        if not batch:
            return None
        for key, value in kwargs.items():
            if hasattr(batch, key):
                setattr(batch, key, value)
        self.db.commit()
        self.db.refresh(batch)
        return batch

    def delete_batch(self, batch_id: int) -> bool:
        batch = self.get_batch_by_id(batch_id)
        if not batch:
            return False
        self.db.delete(batch)
        self.db.commit()
        return True

    # --- StudentRecord ---
    def get_record_by_id(self, record_id: int) -> Optional[StudentRecord]:
        return self.db.query(StudentRecord).filter(StudentRecord.id == record_id).first()

    def list_records(
        self,
        dataset_batch_id: Optional[int] = None,
        data_status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
    ) -> Tuple[int, List[StudentRecord]]:
        q = self.db.query(StudentRecord)
        if dataset_batch_id is not None:
            q = q.filter(StudentRecord.dataset_batch_id == dataset_batch_id)
        if data_status is not None:
            q = q.filter(StudentRecord.data_status == data_status)
        if search:
            search_pattern = f"%{search}%"
            q = q.filter(
                (StudentRecord.student_code.ilike(search_pattern)) |
                (StudentRecord.student_name.ilike(search_pattern))
            )
        total = q.count()
        items = q.order_by(StudentRecord.id).offset(skip).limit(limit).all()
        return total, items

    def create_record(self, **kwargs) -> StudentRecord:
        record = StudentRecord(**kwargs)
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def bulk_create_records(self, records: List[dict]) -> int:
        self.db.bulk_insert_mappings(StudentRecord, records)
        self.db.commit()
        return len(records)

    def update_record(self, record_id: int, **kwargs) -> Optional[StudentRecord]:
        record = self.get_record_by_id(record_id)
        if not record:
            return None
        for key, value in kwargs.items():
            if hasattr(record, key) and value is not None:
                setattr(record, key, value)
        self.db.commit()
        self.db.refresh(record)
        return record

    def delete_record(self, record_id: int) -> bool:
        record = self.get_record_by_id(record_id)
        if not record:
            return False
        self.db.delete(record)
        self.db.commit()
        return True

    def get_records_for_batch(self, batch_id: int) -> List[StudentRecord]:
        return (
            self.db.query(StudentRecord)
            .filter(StudentRecord.dataset_batch_id == batch_id)
            .all()
        )

    def count_records_by_status(self, batch_id: int) -> dict:
        rows = (
            self.db.query(StudentRecord.data_status, func.count(StudentRecord.id))
            .filter(StudentRecord.dataset_batch_id == batch_id)
            .group_by(StudentRecord.data_status)
            .all()
        )
        return {str(status): count for status, count in rows}
