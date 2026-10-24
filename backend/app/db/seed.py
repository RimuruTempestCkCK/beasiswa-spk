import logging
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.dataset import DatasetBatch, StudentRecord, SourceType, BatchStatus, DataStatus
from app.core.security import hash_password

logger = logging.getLogger("beasiswa_spk")

# 50 records data mahasiswa dengan nama Indonesia realistis dan NIM resmi
# 6 Indikator Kanonis: ipk, parent_income, family_dependents, academic_achievement_score, nonacademic_achievement_score, attendance_percentage
REALISTIC_STUDENTS = [
    ("MHS2024001", "Ahmad Fauzi", 3.75, 1500000.0, 3, 3.0, 2.0, 95.0),
    ("MHS2024002", "Siti Nurhaliza", 2.90, 3500000.0, 1, 1.0, 1.0, 80.0),
    ("MHS2024003", "Budi Santoso", 3.50, 1200000.0, 4, 2.0, 3.0, 92.0),
    ("MHS2024004", "Dewi Lestari", 2.50, 5000000.0, 2, 0.0, 0.0, 70.0),
    ("MHS2024005", "Rizky Ramadhan", 3.85, 800000.0, 5, 4.0, 3.0, 98.0),
    ("MHS2024006", "Putri Ayu Wardani", 3.10, 2000000.0, 2, 2.0, 1.0, 85.0),
    ("MHS2024007", "Muhammad Ilham Pratama", 2.70, 4500000.0, 1, 0.0, 2.0, 75.0),
    ("MHS2024008", "Anisa Rahmawati", 3.60, 1000000.0, 4, 3.0, 2.0, 90.0),
    ("MHS2024009", "Fajar Hidayat", 2.30, 6000000.0, 0, 0.0, 0.0, 65.0),
    ("MHS2024010", "Nabila Syahrani", 3.90, 900000.0, 5, 4.0, 4.0, 99.0),
    ("MHS2024011", "Dimas Arya Kusuma", 3.20, 2500000.0, 3, 1.0, 1.0, 82.0),
    ("MHS2024012", "Rina Wulandari", 2.80, 3000000.0, 2, 1.0, 0.0, 78.0),
    ("MHS2024013", "Hendra Gunawan", 3.70, 1100000.0, 4, 3.0, 3.0, 94.0),
    ("MHS2024014", "Tiara Andini", 2.40, 7000000.0, 1, 0.0, 0.0, 68.0),
    ("MHS2024015", "Bayu Pratama", 3.45, 1800000.0, 3, 2.0, 2.0, 88.0),
    ("MHS2024016", "Maya Safitri", 2.60, 4000000.0, 2, 0.0, 1.0, 72.0),
    ("MHS2024017", "Reza Firmansyah", 3.80, 750000.0, 5, 4.0, 3.0, 97.0),
    ("MHS2024018", "Indah Permatasari", 3.00, 3200000.0, 1, 1.0, 1.0, 81.0),
    ("MHS2024019", "Doni Saputra", 2.20, 8000000.0, 0, 0.0, 0.0, 62.0),
    ("MHS2024020", "Zahra Aulia", 3.95, 700000.0, 6, 4.0, 4.0, 100.0),
    ("MHS2024021", "Eko Prasetyo", 3.30, 2200000.0, 3, 2.0, 1.0, 84.0),
    ("MHS2024022", "Fitri Handayani", 2.75, 3800000.0, 2, 0.0, 1.0, 76.0),
    ("MHS2024023", "Gilang Ramadhan", 3.55, 1300000.0, 4, 3.0, 2.0, 91.0),
    ("MHS2024024", "Nurul Hidayah", 2.45, 5500000.0, 1, 0.0, 0.0, 67.0),
    ("MHS2024025", "Yusuf Maulana", 3.65, 1050000.0, 5, 3.0, 3.0, 93.0),
    ("MHS2024026", "Tri Wahyuni", 2.95, 2800000.0, 2, 1.0, 0.0, 79.0),
    ("MHS2024027", "Alif Akbar", 3.15, 1900000.0, 3, 2.0, 2.0, 86.0),
    ("MHS2024028", "Dian Sastro", 2.55, 4200000.0, 1, 0.0, 1.0, 73.0),
    ("MHS2024029", "Bagas Pangestu", 3.82, 850000.0, 5, 4.0, 3.0, 96.0),
    ("MHS2024030", "Mega Utami", 3.05, 3100000.0, 2, 1.0, 1.0, 80.5),
    ("MHS2024031", "Arif Kurniawan", 2.35, 6500000.0, 0, 0.0, 0.0, 64.0),
    ("MHS2024032", "Salma Khairunnisa", 3.88, 780000.0, 5, 4.0, 4.0, 98.5),
    ("MHS2024033", "Rifky Alamsyah", 3.25, 2100000.0, 3, 2.0, 1.0, 83.0),
    ("MHS2024034", "Kartika Sari", 2.65, 4100000.0, 2, 0.0, 0.0, 74.0),
    ("MHS2024035", "Faisal Rachman", 3.48, 1400000.0, 4, 2.0, 2.0, 89.0),
    ("MHS2024036", "Annisa Maharani", 2.42, 5800000.0, 1, 0.0, 0.0, 66.0),
    ("MHS2024037", "Wahyu Nugroho", 3.72, 980000.0, 5, 3.0, 3.0, 95.5),
    ("MHS2024038", "Lestari Anggraini", 2.88, 3300000.0, 2, 1.0, 0.0, 77.0),
    ("MHS2024039", "Kevin Sanjaya", 3.18, 2050000.0, 3, 2.0, 1.0, 85.5),
    ("MHS2024040", "Nadya Octaviani", 2.58, 4300000.0, 1, 0.0, 1.0, 71.0),
    ("MHS2024041", "Danang Wicaksono", 3.78, 820000.0, 5, 4.0, 3.0, 96.5),
    ("MHS2024042", "Novi Anggraeni", 3.08, 2900000.0, 2, 1.0, 1.0, 81.5),
    ("MHS2024043", "Taufik Hidayatullah", 2.28, 7500000.0, 0, 0.0, 0.0, 63.0),
    ("MHS2024044", "Aulia Rahmania", 3.92, 720000.0, 6, 4.0, 4.0, 99.5),
    ("MHS2024045", "Rangga Wijaya", 3.35, 2300000.0, 3, 2.0, 2.0, 87.0),
    ("MHS2024046", "Intan Pertiwi", 2.72, 3700000.0, 2, 0.0, 1.0, 75.5),
    ("MHS2024047", "Iqbal Maulana", 3.52, 1250000.0, 4, 3.0, 2.0, 90.5),
    ("MHS2024048", "Farah Diba", 2.48, 5200000.0, 1, 0.0, 0.0, 69.0),
    ("MHS2024049", "Syahrul Ramadhan", 3.68, 1020000.0, 4, 3.0, 3.0, 92.5),
    ("MHS2024050", "Dwi Cahyani", 2.98, 3050000.0, 2, 1.0, 0.0, 80.0),
]


def auto_seed_data(db: Session, force_reseed: bool = False) -> None:
    """
    Auto-seed default users and initial synthetic dataset batch if not present.
    If force_reseed is True, clears old batches and reseeds cleanly.
    """
    try:
        # 1. Seed Users if table is empty or missing admin
        admin_user = db.query(User).filter(User.email == "admin@beasiswa.local").first()
        if not admin_user:
            logger.info("Seeding default users...")
            default_users = [
                User(
                    name="Administrator Sistem",
                    email="admin@beasiswa.local",
                    password_hash=hash_password("admin123"),
                    role=UserRole.admin,
                    is_active=True,
                ),
                User(
                    name="Budi Santoso (Operator)",
                    email="operator@beasiswa.local",
                    password_hash=hash_password("admin123"),
                    role=UserRole.operator,
                    is_active=True,
                ),
                User(
                    name="Prof. Dr. Irwan Setiawan (Reviewer)",
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

        # 2. Seed Initial Dataset Batch if no batches exist or forced
        batch_count = db.query(DatasetBatch).count()
        if batch_count == 0 or force_reseed:
            if force_reseed:
                logger.info("Force reseed: Deleting existing student records and dataset batches...")
                db.query(StudentRecord).delete()
                db.query(DatasetBatch).delete()
                db.commit()

            logger.info("Seeding default realistic dataset batch...")
            admin_id = admin_user.id if admin_user else None
            batch = DatasetBatch(
                batch_name="Dataset Calon Penerima Beasiswa 2024",
                source_type=SourceType.csv,
                source_filename="data_mahasiswa_beasiswa_2024.csv",
                dataset_description="Dataset resmi calon penerima beasiswa tahun 2024 dengan 6 indikator penilaian kriteria.",
                total_rows=len(REALISTIC_STUDENTS),
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
                for row in REALISTIC_STUDENTS
            ]
            db.add_all(records)
            db.commit()
            logger.info(f"Seeded batch #{batch.id} with {len(records)} realistic student records.")

    except Exception as e:
        db.rollback()
        logger.warning(f"Auto-seed encountered an issue: {e}")
