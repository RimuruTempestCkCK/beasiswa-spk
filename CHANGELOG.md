# Changelog - Sistem SPK Prediksi Kelayakan Beasiswa

Semua perubahan dan aktivitas pengembangan aplikasi didokumentasikan dalam berkas ini sesuai kaidah [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2026-10-24

### Ditambahkan (Added)

#### 1. Struktur Direktori Proyek & Tata Kelola
- Menyelaraskan struktur direktori persis sesuai Bab 9 PRD (fokus lingkungan non-deployment):
  - `docs/` : Spesifikasi kamus data dan dokumentasi metode algoritma
  - `backend/` : Server Python FastAPI, modular ML, layer repository, schema, service, routes
  - `frontend/` : Aplikasi React + Vite mengadaptasi template ArchitectUI tanpa menyertakan demo yang tidak relevan
  - `database/` : Skema DDL MySQL dan data seed sintetis
  - `.gitignore`, `README.md`, `CHANGELOG.md`
- Folder `deployment/` dieliminasi/dihapus sesuai instruksi untuk fokus penuh pada kesiapan kode lokal aplikasi.

#### 2. Basis Data MySQL (`database/schema.sql` & `database/seed_dev.sql`)
- Skema 8 tabel InnoDB dengan utf8mb4:
  - `users`: Autentikasi dan kontrol peran (`admin`, `operator`, `reviewer`).
  - `dataset_batches`: Batch dataset mahasiswa (`draft`, `imported`, `validated`, `rejected`).
  - `student_records`: 6 fitur numerik analitik (`ipk`, `parent_income`, `family_dependents`, `academic_achievement_score`, `nonacademic_achievement_score`, `attendance_percentage`) dengan isolasi agar data mentah tidak tertimpa.
  - `preprocessing_runs`: Metadata eksekusi cleaning & normalisasi serta path artefak scaler.
  - `clustering_runs`: Eksperimen K-Means dengan nilai K, random seed, artefak centroid, dan skor DBI.
  - `cluster_assignments`: Relasi tiap mahasiswa dengan label cluster hasil K-Means terpilih.
  - `model_versions`: Versi model Backpropagation Neural Network beserta metrik evaluasi dan artefak model.
  - `predictions`: Jejak inferensi data mahasiswa baru dengan confidence score.
  - `audit_logs`: Jejak audit setiap aktivitas penting.
- Seed data awal berisi 50 record mahasiswa sintetis dan akun default admin/operator/reviewer untuk verifikasi alur.

#### 3. Backend Python FastAPI (`backend/app/`)
- **Core**: Konfigurasi berbasis Pydantic Settings, JWT Bearer Token, enkripsi kata sandi Bcrypt, dan structured logger.
- **Data Mining & Algoritma (`app/ml/`)**:
  - `data_validation.py`: Pengecekan nama kolom, tipe numerik, dan rentang valid 6 fitur.
  - `preprocessing.py`: Imputasi missing values dengan median data latih dan penskalaan `MinMaxScaler`.
  - `clustering.py`: K-Means clustering dengan perhitungan Davies-Bouldin Index (DBI) komparatif untuk pemilihan K terbaik.
  - `backpropagation.py`: Pelatihan jaringan saraf tiruan (MLP Classifier) berorientasi target label cluster hasil K-Means.
  - `evaluation.py`: Penghitungan matriks akurasi, macro-precision, macro-recall, macro-F1, serta Confusion Matrix.
  - `inference.py`: Transformasi data inferensi menggunakan objek preprocessing tersimpan dan prediksi cluster.
- **RESTful Endpoints (`app/api/v1/endpoints/`)**:
  - `/api/v1/auth`: Login, logout, profil pengguna.
  - `/api/v1/dashboard`: KPI ringkasan sistem.
  - `/api/v1/datasets` & `/records`: Manajemen batch, impor CSV/XLSX dengan validasi dan pratinjau.
  - `/api/v1/preprocessing`: Menjalankan job cleaning & normalisasi latar belakang.
  - `/api/v1/clustering`: Menjalankan uji kandidat K, membandingkan DBI, profil centroid, dan penetapan acuan.
  - `/api/v1/models`: Pelatihan model Backpropagation, evaluasi metrik, dan aktivasi status `ready`.
  - `/api/v1/predictions`: Prediksi data mahasiswa baru hanya dengan model berstatus `ready`.
  - `/api/v1/reports`: Riwayat eksperimen dan ekspor CSV data prediksi.
  - `/api/v1/users` & `/audit-logs`: Tata kelola pengguna dan catatan audit.

#### 4. Frontend React + ArchitectUI (`frontend/src/`)
- Mengadaptasi layout ArchitectUI (Header, Sidebar, ThemeOptions, Footer).
- Menu navigasi yang disesuaikan untuk SPK Beasiswa:
  - **Dashboard**: Ringkasan batch, statistik record, eksperimen clustering, dan model aktif.
  - **Batch Dataset & Import**: Antarmuka dropzone unggah berkas CSV/Excel, validasi kolom, dan pratinjau data.
  - **Data Mahasiswa**: Tabel data mahasiswa terpaginasi.
  - **Preprocessing**: Pemilihan konfigurasi normalisasi dan pemantauan status pekerjaan.
  - **Clustering K-Means**: Form pengujian multi-nilai K, tabel perbandingan DBI, dan penanda eksperimen terpilih.
  - **Training Model**: Penyesuaian hyperparameter Backpropagation (hidden layer, learning rate, epoch) dan riwayat model.
  - **Evaluasi Model**: Tampilan Confusion Matrix dan metrik presisi/recall per cluster disertai catatan disclaimer.
  - **Prediksi Kelayakan**: Form inferensi 6 variabel, visualisasi cluster hasil prediksi, dan riwayat inferensi.
  - **Laporan & Ekspor**: Ringkasan siklus eksperimen dan tombol unduh CSV prediksi.
  - **Pengguna & Audit**: Penambahan pengguna baru dan tabel jejak audit.
- State management autentikasi Redux Toolkit dengan proteksi rute login.

#### 5. Dokumentasi Teknis
- `docs/DATA_DICTIONARY.md`: Spesifikasi dan aturan validasi 6 variabel analitik.
- `docs/ALGORITHM_METHOD.md`: Penjelasan alur KDD, formula Davies-Bouldin Index (DBI), arsitektur Backpropagation, dan pencegahan data leakage.
