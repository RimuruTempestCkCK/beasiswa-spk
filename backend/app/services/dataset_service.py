import os
import uuid
import pandas as pd
from typing import Optional, List, Dict, Any, Tuple
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories.dataset_repo import DatasetRepository
from app.repositories.user_repo import UserRepository
from app.models.dataset import BatchStatus, DataStatus
from app.ml.data_validation import validate_dataframe, REQUIRED_FEATURES
from app.ml.raw_data_cleaner import clean_and_transform_raw_dataset


OPTIONAL_COLUMNS = ["student_code", "student_name"]
ALL_COLUMNS = OPTIONAL_COLUMNS + REQUIRED_FEATURES


class DatasetService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = DatasetRepository(db)

    def list_batches(self, page: int = 1, page_size: int = 20) -> dict:
        skip = (page - 1) * page_size
        total, items = self.repo.list_batches(skip=skip, limit=page_size)
        serialized_items = [
            {
                "id": b.id,
                "batch_name": b.batch_name,
                "name": b.batch_name,
                "source_type": b.source_type,
                "source_filename": b.source_filename,
                "dataset_description": b.dataset_description,
                "description": b.dataset_description,
                "total_rows": b.total_rows,
                "record_count": b.total_rows,
                "status": b.status,
                "created_by": b.created_by,
                "created_at": b.created_at,
            }
            for b in items
        ]
        return {"total": total, "page": page, "page_size": page_size, "items": serialized_items}

    def create_batch(self, batch_name: str, source_type: str, description: Optional[str], created_by: Optional[int]):
        return self.repo.create_batch(batch_name, source_type, description, created_by)

    def get_batch(self, batch_id: int):
        batch = self.repo.get_batch_by_id(batch_id)
        if not batch:
            raise HTTPException(status_code=404, detail="Dataset batch not found")
        return batch

    def delete_batch(self, batch_id: int):
        ok = self.repo.delete_batch(batch_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Dataset batch not found")

    def import_file(
        self,
        batch_id: int,
        file: UploadFile,
        created_by: Optional[int],
        preview_only: bool = False,
    ) -> dict:
        batch = self.get_batch(batch_id)
        filename = file.filename or "upload"
        ext = os.path.splitext(filename)[1].lower()

        uploads_dir = settings.get_uploads_dir()
        save_name = f"{uuid.uuid4().hex}_{filename}"
        save_path = os.path.join(uploads_dir, save_name)

        content = file.file.read()
        with open(save_path, "wb") as f:
            f.write(content)

        # Parse file
        try:
            if ext in (".xlsx", ".xls"):
                df_raw = pd.read_excel(save_path)
                source_type = "excel"
            else:
                df_raw = pd.read_csv(save_path)
                source_type = "csv"
        except Exception as e:
            if os.path.exists(save_path):
                os.remove(save_path)
            raise HTTPException(status_code=400, detail=f"Cannot parse file: {str(e)}")

        # Automatically clean and transform raw format (e.g. Data Awal beasiswa.xlsx)
        # into standard 5 research variables
        df, raw_count, dropped_count = clean_and_transform_raw_dataset(df_raw)

        # Check required columns
        missing = [c for c in REQUIRED_FEATURES if c not in df.columns]
        if missing:
            if os.path.exists(save_path):
                os.remove(save_path)
            raise HTTPException(
                status_code=400,
                detail=f"File missing required columns: {missing}",
            )

        # Validate
        valid_rows, invalid_rows, issues = validate_dataframe(df)
        preview = df.head(10).where(pd.notnull(df), None).to_dict(orient="records")

        if preview_only:
            if os.path.exists(save_path):
                os.remove(save_path)
            return {
                "total_rows": len(df),
                "valid_rows": valid_rows,
                "invalid_rows": invalid_rows,
                "preview": preview,
                "issues": issues[:50],
                "validation": {
                    "total_rows": len(df),
                    "valid_rows": valid_rows,
                    "invalid_rows": invalid_rows,
                    "errors": issues[:50],
                },
            }

        # Insert records
        records_to_insert = []
        for _, row in df.iterrows():
            row_dict = {
                "dataset_batch_id": batch_id,
                "student_code": str(row.get("student_code", "")) or None,
                "student_name": str(row.get("student_name", "")) or None,
                "data_status": DataStatus.raw.value,
            }
            for feat in REQUIRED_FEATURES:
                val = row.get(feat)
                try:
                    row_dict[feat] = float(val) if pd.notna(val) else None
                except (TypeError, ValueError):
                    row_dict[feat] = None
            records_to_insert.append(row_dict)

        self.repo.bulk_create_records(records_to_insert)
        self.repo.update_batch(
            batch_id,
            total_rows=len(df),
            status=BatchStatus.imported.value,
            source_filename=filename,
            source_type=source_type,
        )

        return {
            "batch_id": batch_id,
            "total_rows": len(df),
            "valid_rows": valid_rows,
            "invalid_rows": invalid_rows,
            "filename": filename,
            "status": BatchStatus.imported.value,
        }

    def list_records(self, batch_id: int, page: int = 1, page_size: int = 20) -> dict:
        self.get_batch(batch_id)
        skip = (page - 1) * page_size
        total, items = self.repo.list_records(batch_id, skip=skip, limit=page_size)
        serialized = [
            {
                "id": r.id,
                "dataset_batch_id": r.dataset_batch_id,
                "student_code": r.student_code,
                "student_name": r.student_name,
                "nim": r.student_code,
                "nama": r.student_name,
                "ipk": float(r.ipk) if r.ipk is not None else None,
                "parent_income": float(r.parent_income) if r.parent_income is not None else None,
                "penghasilan_ortu": float(r.parent_income) if r.parent_income is not None else None,
                "family_dependents": r.family_dependents,
                "jumlah_tanggungan": r.family_dependents,
                "academic_achievement_score": float(r.academic_achievement_score) if r.academic_achievement_score is not None else None,
                "skor_prestasi_akademik": float(r.academic_achievement_score) if r.academic_achievement_score is not None else None,
                "nonacademic_achievement_score": float(r.nonacademic_achievement_score) if r.nonacademic_achievement_score is not None else None,
                "skor_prestasi_nonakademik": float(r.nonacademic_achievement_score) if r.nonacademic_achievement_score is not None else None,
                "data_status": r.data_status,
                "created_at": r.created_at,
            }
            for r in items
        ]
        return {"total": total, "page": page, "page_size": page_size, "items": serialized}
