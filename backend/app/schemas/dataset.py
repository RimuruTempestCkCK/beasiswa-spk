from pydantic import BaseModel, model_validator
from typing import Optional, List, Any
from datetime import datetime
from app.models.dataset import SourceType, BatchStatus, DataStatus


class DatasetBatchCreate(BaseModel):
    batch_name: Optional[str] = None
    name: Optional[str] = None
    source_type: SourceType = SourceType.csv
    dataset_description: Optional[str] = None
    description: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            name = values.get("batch_name") or values.get("name")
            if not name:
                raise ValueError("Nama batch (batch_name / name) wajib diisi")
            values["batch_name"] = name
            desc = values.get("dataset_description") or values.get("description")
            values["dataset_description"] = desc
        return values


class DatasetBatchOut(BaseModel):
    id: int
    batch_name: str
    name: Optional[str] = None
    source_filename: Optional[str]
    source_type: SourceType
    dataset_description: Optional[str]
    description: Optional[str] = None
    total_rows: int
    record_count: Optional[int] = None
    status: BatchStatus
    created_by: Optional[int]
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            b_name = getattr(data, "batch_name", None)
            desc = getattr(data, "dataset_description", None)
            total = getattr(data, "total_rows", 0)
            setattr(data, "name", b_name)
            setattr(data, "description", desc)
            setattr(data, "record_count", total)
        elif isinstance(data, dict):
            b_name = data.get("batch_name")
            desc = data.get("dataset_description")
            total = data.get("total_rows", 0)
            data["name"] = b_name
            data["description"] = desc
            data["record_count"] = total
        return data

    model_config = {"from_attributes": True}


class StudentRecordCreate(BaseModel):
    dataset_batch_id: Optional[int] = None
    dataset_id: Optional[int] = None
    student_code: Optional[str] = None
    nim: Optional[str] = None
    student_name: Optional[str] = None
    nama: Optional[str] = None
    ipk: Optional[float] = None
    parent_income: Optional[float] = None
    penghasilan_ortu: Optional[float] = None
    family_dependents: Optional[int] = None
    jumlah_tanggungan: Optional[int] = None
    academic_achievement_score: Optional[float] = None
    skor_prestasi_akademik: Optional[float] = None
    nonacademic_achievement_score: Optional[float] = None
    skor_prestasi_nonakademik: Optional[float] = None
    attendance_percentage: Optional[float] = None
    persentase_kehadiran: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            batch_id = values.get("dataset_batch_id") or values.get("dataset_id")
            if not batch_id:
                raise ValueError("dataset_batch_id or dataset_id is required")
            values["dataset_batch_id"] = int(batch_id)
            values["student_code"] = values.get("student_code") or values.get("nim")
            values["student_name"] = values.get("student_name") or values.get("nama")
            if values.get("penghasilan_ortu") is not None and values.get("parent_income") is None:
                values["parent_income"] = float(values["penghasilan_ortu"])
            if values.get("jumlah_tanggungan") is not None and values.get("family_dependents") is None:
                values["family_dependents"] = int(values["jumlah_tanggungan"])
            if values.get("skor_prestasi_akademik") is not None and values.get("academic_achievement_score") is None:
                values["academic_achievement_score"] = float(values["skor_prestasi_akademik"])
            if values.get("skor_prestasi_nonakademik") is not None and values.get("nonacademic_achievement_score") is None:
                values["nonacademic_achievement_score"] = float(values["skor_prestasi_nonakademik"])
            if values.get("persentase_kehadiran") is not None and values.get("attendance_percentage") is None:
                values["attendance_percentage"] = float(values["persentase_kehadiran"])
        return values


class StudentRecordUpdate(BaseModel):
    student_code: Optional[str] = None
    nim: Optional[str] = None
    student_name: Optional[str] = None
    nama: Optional[str] = None
    ipk: Optional[float] = None
    parent_income: Optional[float] = None
    penghasilan_ortu: Optional[float] = None
    family_dependents: Optional[int] = None
    jumlah_tanggungan: Optional[int] = None
    academic_achievement_score: Optional[float] = None
    skor_prestasi_akademik: Optional[float] = None
    nonacademic_achievement_score: Optional[float] = None
    skor_prestasi_nonakademik: Optional[float] = None
    attendance_percentage: Optional[float] = None
    persentase_kehadiran: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if values.get("nim") and not values.get("student_code"):
                values["student_code"] = values["nim"]
            if values.get("nama") and not values.get("student_name"):
                values["student_name"] = values["nama"]
            if values.get("penghasilan_ortu") is not None and values.get("parent_income") is None:
                values["parent_income"] = float(values["penghasilan_ortu"])
            if values.get("jumlah_tanggungan") is not None and values.get("family_dependents") is None:
                values["family_dependents"] = int(values["jumlah_tanggungan"])
            if values.get("skor_prestasi_akademik") is not None and values.get("academic_achievement_score") is None:
                values["academic_achievement_score"] = float(values["skor_prestasi_akademik"])
            if values.get("skor_prestasi_nonakademik") is not None and values.get("nonacademic_achievement_score") is None:
                values["nonacademic_achievement_score"] = float(values["skor_prestasi_nonakademik"])
            if values.get("persentase_kehadiran") is not None and values.get("attendance_percentage") is None:
                values["attendance_percentage"] = float(values["persentase_kehadiran"])
        return values


class StudentRecordOut(BaseModel):
    id: int
    dataset_batch_id: int
    student_code: Optional[str]
    student_name: Optional[str]
    nim: Optional[str] = None
    nama: Optional[str] = None
    ipk: Optional[float]
    parent_income: Optional[float]
    penghasilan_ortu: Optional[float] = None
    family_dependents: Optional[int]
    jumlah_tanggungan: Optional[int] = None
    academic_achievement_score: Optional[float]
    skor_prestasi_akademik: Optional[float] = None
    nonacademic_achievement_score: Optional[float]
    skor_prestasi_nonakademik: Optional[float] = None
    attendance_percentage: Optional[float]
    persentase_kehadiran: Optional[float] = None
    data_status: DataStatus
    validation_notes: Optional[str]
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            code = getattr(data, "student_code", None)
            name = getattr(data, "student_name", None)
            inc = getattr(data, "parent_income", None)
            dep = getattr(data, "family_dependents", None)
            acad = getattr(data, "academic_achievement_score", None)
            nonacad = getattr(data, "nonacademic_achievement_score", None)
            att = getattr(data, "attendance_percentage", None)
            setattr(data, "nim", code)
            setattr(data, "nama", name)
            setattr(data, "penghasilan_ortu", float(inc) if inc is not None else None)
            setattr(data, "jumlah_tanggungan", dep)
            setattr(data, "skor_prestasi_akademik", float(acad) if acad is not None else None)
            setattr(data, "skor_prestasi_nonakademik", float(nonacad) if nonacad is not None else None)
            setattr(data, "persentase_kehadiran", float(att) if att is not None else None)
        elif isinstance(data, dict):
            data["nim"] = data.get("student_code")
            data["nama"] = data.get("student_name")
            data["penghasilan_ortu"] = data.get("parent_income")
            data["jumlah_tanggungan"] = data.get("family_dependents")
            data["skor_prestasi_akademik"] = data.get("academic_achievement_score")
            data["skor_prestasi_nonakademik"] = data.get("nonacademic_achievement_score")
            data["persentase_kehadiran"] = data.get("attendance_percentage")
        return data

    model_config = {"from_attributes": True}


class ImportValidationResult(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    preview: List[dict]
    issues: List[dict]


class PaginatedRecords(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[StudentRecordOut]


# Aliases for endpoints consistency
BatchCreateRequest = DatasetBatchCreate
BatchResponse = DatasetBatchOut
RecordCreateRequest = StudentRecordCreate
RecordUpdateRequest = StudentRecordUpdate
RecordResponse = StudentRecordOut
