import logging
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.dataset import DatasetBatch, StudentRecord, SourceType, BatchStatus, DataStatus
from app.core.security import hash_password

logger = logging.getLogger("beasiswa_spk")

# 50 records data sintetis resmi yang konsisten dengan database/seed_dev.sql
# 6 Indikator Kanonis: ipk, parent_income, family_dependents, academic_achievement_score, nonacademic_achievement_score, attendance_percentage
SYNTHETIC_STUDENTS = [
    ("SYN001", "Mahasiswa Sintetis 01", 3.75, 1500000.0, 3, 3.0, 2.0, 95.0),
    ("SYN002", "Mahasiswa Sintetis 02", 2.90, 3500000.0, 1, 1.0, 1.0, 80.0),
    ("SYN003", "Mahasiswa Sintetis 03", 3.50, 1200000.0, 4, 2.0, 3.0, 92.0),
    ("SYN004", "Mahasiswa Sintetis 04", 2.50, 5000000.0, 2, 0.0, 0.0, 70.0),
    ("SYN005", "Mahasiswa Sintetis 05", 3.85, 800000.0, 5, 4.0, 3.0, 98.0),
    ("SYN006", "Mahasiswa Sintetis 06", 3.10, 2000000.0, 2, 2.0, 1.0, 85.0),
    ("SYN007", "Mahasiswa Sintetis 07", 2.70, 4500000.0, 1, 0.0, 2.0, 75.0),
    ("SYN008", "Mahasiswa Sintetis 08", 3.60, 1000000.0, 4, 3.0, 2.0, 90.0),
    ("SYN009", "Mahasiswa Sintetis 09", 2.30, 6000000.0, 0, 0.0, 0.0, 65.0),
    ("SYN010", "Mahasiswa Sintetis 10", 3.90, 900000.0, 5, 4.0, 4.0, 99.0),
    ("SYN011", "Mahasiswa Sintetis 11", 3.20, 2500000.0, 3, 1.0, 1.0, 82.0),
    ("SYN012", "Mahasiswa Sintetis 12", 2.80, 3000000.0, 2, 1.0, 0.0, 78.0),
    ("SYN013", "Mahasiswa Sintetis 13", 3.70, 1100000.0, 4, 3.0, 3.0, 94.0),
    ("SYN014", "Mahasiswa Sintetis 14", 2.40, 7000000.0, 1, 0.0, 0.0, 68.0),
    ("SYN015", "Mahasiswa Sintetis 15", 3.45, 1800000.0, 3, 2.0, 2.0, 88.0),
    ("SYN016", "Mahasiswa Sintetis 16", 2.60, 4000000.0, 2, 0.0, 1.0, 72.0),
    ("SYN017", "Mahasiswa Sintetis 17", 3.80, 750000.0, 5, 4.0, 3.0, 97.0),
    ("SYN018", "Mahasiswa Sintetis 18", 3.00, 3200000.0, 1, 1.0, 1.0, 81.0),
    ("SYN019", "Mahasiswa Sintetis 19", 2.20, 8000000.0, 0, 0.0, 0.0, 62.0),
    ("SYN020", "Mahasiswa Sintetis 20", 3.95, 700000.0, 6, 4.0, 4.0, 100.0),
    ("SYN021", "Mahasiswa Sintetis 21", 3.30, 2200000.0, 3, 2.0, 1.0, 84.0),
    ("SYN022", "Mahasiswa Sintetis 22", 2.75, 3800000.0, 2, 0.0, 1.0, 76.0),
    ("SYN023", "Mahasiswa Sintetis 23", 3.55, 1300000.0, 4, 3.0, 2.0, 91.0),
    ("SYN024", "Mahasiswa Sintetis 24", 2.45, 5500000.0, 1, 0.0, 0.0, 67.0),
    ("SYN025", "Mahasiswa Sintetis 25", 3.65, 1050000.0, 5, 3.0, 3.0, 93.0),
    ("SYN026", "Mahasiswa Sintetis 26", 2.95, 2800000.0, 2, 1.0, 0.0, 79.0),
    ("SYN027", "Mahasiswa Sintetis 27", 3.15, 1900000.0, 3, 2.0, 2.0, 86.0),
    ("SYN028", "Mahasiswa Sintetis 28", 2.55, 4200000.0, 1, 0.0, 1.0, 73.0),
    ("SYN029", "Mahasiswa Sintetis 29", 3.82, 850000.0, 5, 4.0, 3.0, 96.0),
    ("SYN030", "Mahasiswa Sintetis 30", 3.05, 3100000.0, 2, 1.0, 1.0, 80.5),
    ("SYN031", "Mahasiswa Sintetis 31", 2.35, 6500000.0, 0, 0.0, 0.0, 64.0),
    ("SYN032", "Mahasiswa Sintetis 32", 3.88, 780000.0, 5, 4.0, 4.0, 98.5),
    ("SYN033", "Mahasiswa Sintetis 33", 3.25, 2100000.0, 3, 2.0, 1.0, 83.0),
    ("SYN034", "Mahasiswa Sintetis 34", 2.65, 4100000.0, 2, 0.0, 0.0, 74.0),
    ("SYN035", "Mahasiswa Sintetis 35", 3.48, 1400000.0, 4, 2.0, 2.0, 89.0),
    ("SYN036", "Mahasiswa Sintetis 36", 2.42, 5800000.0, 1, 0.0, 0.0, 66.0),
    ("SYN037", "Mahasiswa Sintetis 37", 3.72, 980000.0, 5, 3.0, 3.0, 95.5),
    ("SYN038", "Mahasiswa Sintetis 38", 2.88, 3300000.0, 2, 1.0, 0.0, 77.0),
    ("SYN039", "Mahasiswa Sintetis 39", 3.18, 2050000.0, 3, 2.0, 1.0, 85.5),
    ("SYN040", "Mahasiswa Sintetis 40", 2.58, 4300000.0, 1, 0.0, 1.0, 71.0),
    ("SYN041", "Mahasiswa Sintetis 41", 3.78, 820000.0, 5, 4.0, 3.0, 96.5),
    ("SYN042", "Mahasiswa Sintetis 42", 3.08, 2900000.0, 2, 1.0, 1.0, 81.5),
    ("SYN043", "Mahasiswa Sintetis 43", 2.28, 7500000.0, 0, 0.0, 0.0, 63.0),
    ("SYN044", "Mahasiswa Sintetis 44", 3.92, 720000.0, 6, 4.0, 4.0, 99.5),
    ("SYN045", "Mahasiswa Sintetis 45", 3.35, 2300000.0, 3, 2.0, 2.0, 87.0),
    ("SYN046", "Mahasiswa Sintetis 46", 2.72, 3700000.0, 2, 0.0, 1.0, 75.5),
    ("SYN047", "Mahasiswa Sintetis 47", 3.52, 1250000.0, 4, 3.0, 2.0, 90.5),
    ("SYN048", "Mahasiswa Sintetis 48", 2.48, 5200000.0, 1, 0.0, 0.0, 69.0),
    ("SYN049", "Mahasiswa Sintetis 49", 3.68, 1020000.0, 4, 3.0, 3.0, 92.5),
    ("SYN050", "Mahasiswa Sintetis 50", 2.98, 3050000.0, 2, 1.0, 0.0, 80.0),
]


def auto_seed_data(db: Session) -> None:
    """
    Auto-seed default users and initial synthetic dataset batch if not present.
    Safe to run repeatedly on startup.
    """
    try:
        # 1. Seed Users if table is empty or missing admin
        admin_user = db.query(User).filter(User.email == "admin@beasiswa.local").first()
        if not admin_user:
            logger.info("Seeding default users...")
            default_users = [
                User(
                    name="Administrator",
                    email="admin@beasiswa.local",
                    password_hash=hash_password("admin123"),
                    role=UserRole.admin,
                    is_active=True,
                ),
                User(
                    name="Operator Satu",
                    email="operator@beasiswa.local",
                    password_hash=hash_password("admin123"),
                    role=UserRole.operator,
                    is_active=True,
                ),
                User(
                    name="Penelaah Satu",
                    email="reviewer@beasiswa.local",
                    password_hash=hash_password("admin123"),
                    role=UserRole.reviewer,
                    is_active=True,
                ),
            ]
            db.add_all(default_users)
            db.commit()
            admin_user = db.query(User).filter(User.email == "admin@beasiswa.local").first()
            logger.info("Default users seeded successfully (admin@beasiswa.local / admin123).")

        # 2. Seed Initial Dataset Batch if no batches exist
        batch_count = db.query(DatasetBatch).count()
        if batch_count == 0:
            logger.info("Seeding default synthetic dataset batch...")
            admin_id = admin_user.id if admin_user else None
            batch = DatasetBatch(
                batch_name="Dataset Sintetis 2026 [DEV]",
                source_type=SourceType.synthetic,
                dataset_description="Dataset sintetis untuk pengujian aplikasi dan clustering 6 indikator.",
                total_rows=len(SYNTHETIC_STUDENTS),
                status=BatchStatus.imported,
                created_by=admin_id,
            )
            db.add(batch)
            db.commit()
            db.refresh(batch)

            records = [
                StudentRecord(
                    dataset_batch_id=batch.id,
                    student_code=row[0],
                    student_name=row[1],
                    ipk=row[2],
                    parent_income=row[3],
                    family_dependents=row[4],
                    academic_achievement_score=row[5],
                    nonacademic_achievement_score=row[6],
                    attendance_percentage=row[7],
                    data_status=DataStatus.validated,
                )
                for row in SYNTHETIC_STUDENTS
            ]
            db.add_all(records)
            db.commit()
            logger.info(f"Seeded batch #{batch.id} with {len(records)} synthetic student records.")

    except Exception as e:
        db.rollback()
        logger.warning(f"Auto-seed encountered an issue (can be skipped safely): {e}")
