# LAPORAN KOMPREHENSIF SISTEM PENDUKUNG KEPUTUSAN (SPK) BEASISWA
**Metode: Kombinasi K-Means Clustering & Artificial Neural Network (Backpropagation MLP)**
**Template UI: Registrar Design System | Framework: React + Vite & FastAPI Python**

---

## 1. PENDAHULUAN & TUJUAN SISTEM
Sistem Pendukung Keputusan (SPK) Beasiswa ini dirancang untuk memprediksi dan merekomendasikan kelayakan calon penerima beasiswa perguruan tinggi secara objektif, transparan, dan berbasis data science (*Knowledge Discovery in Databases* / KDD).

Permasalahan seleksi beasiswa sering menghadapi:
1. Ketiadaan data berlabel historis (*unlabeled data*) untuk penerima yang layak vs tidak layak.
2. Dimensi kriteria majemuk (akademik, finansial, dan kedisiplinan).
3. Subjektivitas tim penyeleksi manual.

**Solusi Sistem:**
- **Tahap 1 (Unsupervised Learning):** Algoritma **K-Means Clustering** mengelompokkan data historis mahasiswa ke dalam klaster ($K=2, 3, 4$). Kualitas klaster diuji menggunakan **Davies-Bouldin Index (DBI)** untuk memilih konfigurasi optimal (klaster dengan DBI terendah). Klaster terbaik diinterpretasikan dan dijadikan pseudo-label target kelayakan beasiswa.
- **Tahap 2 (Supervised Learning):** Algoritma **Backpropagation (Multilayer Perceptron / MLP Classifier)** dilatih menggunakan pseudo-label hasil klaster terbaik tersebut. Model yang telah diuji metrik performanya (*Accuracy, Precision, Recall, F1-Score, Confusion Matrix*) digunakan untuk menginferensi/memprediksi kelayakan berkas mahasiswa baru secara otomatis.

---

## 2. RUANG LINGKUP SISTEM (SCOPE)

### A. Fitur Input (6 Atribut Utama yang Dipakai ML)
Sesuai ketetapan dokumen PRD/BRD, sistem **hanya** menggunakan 6 fitur numerik berikut untuk pelatihan dan inferensi:
1. `ipk` (Indeks Prestasi Kumulatif, skala 0.00 – 4.00)
2. `parent_income` / `penghasilan_ortu` (Penghasilan orang tua per bulan dlm Rupiah)
3. `family_dependents` / `jumlah_tanggungan` (Jumlah tanggungan keluarga)
4. `academic_achievement_score` / `skor_prestasi_akademik` (Skor prestasi akademik, skala 0 – 100)
5. `nonacademic_achievement_score` / `skor_prestasi_nonakademik` (Skor prestasi non-akademik, skala 0 – 100)
6. `attendance_percentage` / `persentase_kehadiran` (Persentase kehadiran kuliah, skala 0 – 100%)

> *Catatan Penting:* Atribut `student_code` / `nim` dan `student_name` / `nama` strictly berfungsi sebagai pengenal identitas visual (*identifiers*) dan **tidak pernah diikutkan** ke dalam perhitungan matriks machine learning.

### B. Peran Pengguna (Role-Based Access Control / RBAC)
1. **Admin:**
   - Akses penuh seluruh sistem: manajemen pengguna, audit log, dataset, preprocessing, training, manajemen model ready, inferensi, dan laporan.
2. **Operator (Staf Seleksi):**
   - Mengelola batch dataset, import CSV/Excel, menjalankan preprocessing, clustering, pelatihan model, dan melakukan prediksi. Tidak dapat menambah/menghapus pengguna admin.
3. **Viewer (Pimpinan / Auditor):**
   - Akses read-only terhadap dashboard KPI, hasil evaluasi model, profil klaster, dan unduhan laporan prediksi.

---

## 3. ARSITEKTUR TEKNOLOGI

| Lapisan | Teknologi / Pustaka | Keterangan |
|:---|:---|:---|
| **Frontend UI** | React 19, Vite, Redux Toolkit, React Router v7 | Berbasis **Registrar Template** (Deep Teal palette, typography Figtree, no-scrollbar clean layout) |
| **Visualisasi** | Chart.js, React-Chartjs-2 | Radar Chart untuk Centroid Klaster, Confusion Matrix, Donut Chart |
| **Backend API** | Python 3.12/3.14, FastAPI, Pydantic v2 | Arsitektur modular Clean Architecture (API, Services, Repositories) |
| **Data Science / ML** | Scikit-Learn, Pandas, NumPy, Joblib | Pipeline Preprocessing, KMeans, MLPClassifier, Davies-Bouldin Index |
| **Database** | MySQL 8.0, SQLAlchemy ORM | Skema relasional ACID compliant dengan Foreign Keys CASCADE / SET NULL |
| **Security & Auth** | OAuth2 Bearer JWT (`python-jose`), Bcrypt | Stateless authentication, granular permission checks |

---

## 4. DAFTAR LENGKAP FITUR DAN HALAMAN (UC-01 s/d UC-13)

### 1. Modul Autentikasi (`/login`)
- **Fitur:** Login menggunakan Email & Password, validasi Bcrypt hash, penerbitan JWT access token (kedaluwarsa 60 menit), simpan state di Redux + LocalStorage.
- **Handling:** Redirect otomatis sesuai hak akses dan pesan error ramah jika kredensial salah.

### 2. Modul Dashboard (`/`)
- **Fitur:**
  - **4 KPI Card Ringkasan:** Total Batches, Total Records, Total Clustering Experiments, Active Ready Models.
  - **Tabel Batch Terbaru:** Menampilkan 5 batch dataset terakhir beserta status validasi.
  - **Tabel Model Aktif:** Menampilkan versi model Backpropagation yang siap inferensi.
  - **Diagram Alur KDD:** Representasi visual alur *Selection $\rightarrow$ Preprocessing $\rightarrow$ Clustering $\rightarrow$ Data Mining (ANN) $\rightarrow$ Interpretation*.

### 3. Modul Batch Dataset (`/datasets`)
- **Fitur:**
  - Menampilkan daftar batch data mahasiswa per periode beasiswa.
  - Pencarian, pagination, dan tombol **"Buat Batch Baru"** (modal input nama batch dan deskripsi).
  - Tampilan indikator badge status batch (`draft`, `imported`, `validated`, `processed`).

### 4. Modul Import Dataset (`/datasets/import`)
- **Fitur:**
  - Upload file CSV (`.csv`) atau Excel (`.xlsx`, `.xls`).
  - **Validasi Skema Otomatis:** Memeriksa keberadaan 6 kolom wajib.
  - **Mode Preview Sebelum Komit:** Menampilkan pratinjau 10 baris pertama beserta deteksi baris valid vs tidak valid sebelum data disimpan ke database.

### 5. Modul Detail Dataset & Records (`/datasets/:id`)
- **Fitur:**
  - Menampilkan seluruh data record mahasiswa dalam suatu batch.
  - Fitur pencarian instan berdasarkan NIM atau Nama mahasiswa.
  - Filter berdasarkan status validitas data.
  - Tombol aksi Tambah Record Baru (modal form manual), Edit Record, dan Hapus Record.
  - Ekspor/unduh data batch.

### 6. Modul Preprocessing Data (`/preprocessing`)
- **Fitur:**
  - Pemilihan batch dataset sumber.
  - Konfigurasi penanganan nilai kosong (*Missing Value Imputation*): opsi `median` atau `mean`.
  - Konfigurasi penskalaan fitur (*Feature Scaling*): `Min-Max Scaler` (0 sampai 1) atau `Standard Scaler` (Z-score).
  - Eksekusi asynchronous: mencatat log baris input, baris output, serta menyimpan objek pipeline ke artefak `.joblib`.

### 7. Modul K-Means Clustering (`/clustering`)
- **Fitur:**
  - Menjalankan eksperimen klasterisasi multi-$K$ sekaligus ($K=2, 3, 4$) dengan random state terkontrol.
  - **Perhitungan DBI Otomatis:** Sistem menghitung *Davies-Bouldin Index* untuk setiap nilai $K$.
  - **Seleksi Klaster Rujukan:** Tombol untuk memilih satu hasil klaster terbaik sebagai label acuan beasiswa.
  - **Visualisasi Profil Klaster:** Menampilkan rata-rata tiap fitur untuk Klaster 0 vs Klaster 1 (e.g. Klaster Layak = IPK tinggi, penghasilan ortu rendah).
  - **Tabel Anggota Klaster:** Menampilkan jarak setiap mahasiswa ke centroid (`distance_to_centroid`).

### 8. Modul Pelatihan Model Backpropagation (`/training`)
- **Fitur:**
  - Menggunakan klaster rujukan terpilih sebagai target supervised learning.
  - **Konfigurasi Hiperparameter Fleksibel:**
    - Hidden Layer Sizes (e.g. `64, 32` atau `100`)
    - Learning Rate (`0.001` dsb)
    - Max Iterations / Epochs (`200` – `1000`)
    - Split Data Train/Test (`80:20` atau `70:30`)
    - Fungsi Aktivasi (`relu`, `logistic/sigmoid`, `tanh`)
  - Status monitoring pelatihan (`training`, `ready`, `failed`, `archived`).
  - Tombol **"Jadikan Model Aktif (Set Ready)"** untuk menentukan model mana yang dipakai pada inferensi real-time.

### 9. Modul Evaluasi Model (`/evaluation`)
- **Fitur:**
  - Pemilihan versi model yang ingin diinspeksi.
  - **Metrik Klasifikasi Lengkap:**
    - Accuracy Score
    - Precision Macro
    - Recall Macro
    - F1-Score Macro
  - **Confusion Matrix Interaktif:** Matriks prediksi benar vs salah untuk tiap kelas kelayakan.
  - **Per-Class Breakdown:** Analisis performa presisi dan recall terpisah untuk kategori *Layak* dan *Tidak Layak*.
  - **Banner Peringatan Analitis:** Penjelasan bahwa rekomendasi model bersifat pendukung keputusan dan memerlukan verifikasi berkas faktual.

### 10. Modul Prediksi Kelayakan Real-time (`/predictions`)
- **Fitur:**
  - Form input simulasi/calon penerima beasiswa baru dengan 6 atribut.
  - Inferensi seketika (*real-time inference*) menggunakan model Backpropagation yang berstatus `ready`.
  - Menampilkan hasil keputusan: **"DIREKOMENDASIKAN (LAYAK)"** atau **"TIDAK DIREKOMENDASIKAN"** disertai skor probabilitas/confidence level (e.g. `94.2%`).
  - **Tabel Riwayat Prediksi:** Menyimpan seluruh riwayat inferensi mandiri lengkap dengan tanggal, parameter, dan user yang menguji.

### 11. Modul Laporan & Riwayat Eksperimen (`/reports`)
- **Fitur:**
  - Ringkasan audit eksperimen data mining (jumlah batch, total preprocessing, eksperimen clustering, dan model terlatih).
  - **Ekspor CSV:** Tombol sekali klik untuk mengekspor seluruh data riwayat prediksi beasiswa ke dalam berkas `predictions_export.csv`.

### 12. Modul Manajemen Pengguna & Hak Akses (`/users`)
- **Fitur:**
  - Manajemen akun staf operator dan administrator.
  - Form tambah user baru dengan enkripsi password Bcrypt otomatis.
  - Switch status pengguna (Aktif / Non-Aktif).
  - **Audit Logs:** Tabel pelacakan rekam jejak aktivitas (*who did what and when*).

---

## 5. STRUKTUR DATABASE (9 TABEL RELASIONAL)

1. **`users`**: `id`, `name`, `email`, `password_hash`, `role` (admin/operator/viewer), `is_active`, `created_at`.
2. **`dataset_batches`**: `id`, `batch_name`, `source_filename`, `source_type` (csv/excel/synthetic), `dataset_description`, `total_rows`, `status`, `created_by`, `created_at`.
3. **`student_records`**: `id`, `dataset_batch_id`, `student_code`, `student_name`, `ipk`, `parent_income`, `family_dependents`, `academic_achievement_score`, `nonacademic_achievement_score`, `attendance_percentage`, `data_status`, `validation_notes`, `created_at`.
4. **`preprocessing_runs`**: `id`, `dataset_batch_id`, `method_version`, `config` (JSON), `status`, `input_rows`, `output_rows`, `artifact_path`, `error_message`, `created_by`, `started_at`, `completed_at`, `created_at`.
5. **`clustering_runs`**: `id`, `preprocessing_run_id`, `algorithm`, `k_value`, `dbi_score`, `random_seed`, `config` (JSON), `status`, `is_selected` (boolean), `artifact_path`, `created_at`.
6. **`cluster_assignments`**: `id`, `clustering_run_id`, `student_record_id`, `cluster_label`, `distance_to_centroid`.
7. **`model_versions`**: `id`, `model_name`, `model_version`, `target_clustering_run_id`, `algorithm`, `training_config` (JSON), `metrics` (JSON), `artifact_path`, `status` (training/ready/failed/archived), `created_by`, `created_at`.
8. **`predictions`**: `id`, `model_version_id`, `ipk`, `parent_income`, `family_dependents`, `academic_achievement_score`, `nonacademic_achievement_score`, `attendance_percentage`, `predicted_cluster`, `confidence_score`, `notes`, `created_by`, `created_at`.
9. **`audit_logs`**: `id`, `user_id`, `action`, `entity_type`, `entity_id`, `details_json`, `created_at`.

---

## 6. PROMPT KHUSUS UNTUK CHATGPT

Jika Anda ingin menanyakan hal teknis, pembuatan skripsi/jurnal, atau pengembangan fitur lanjutan ke ChatGPT, gunakan prompt pembuka berikut:

```text
Halo ChatGPT, saya memiliki sebuah aplikasi web Sistem Pendukung Keputusan (SPK) Seleksi Penerima Beasiswa.
Berikut adalah spesifikasi lengkap arsitektur dan sistem saya:

1. Metode & Algoritma:
   - Tahap 1: K-Means Clustering (Unsupervised Learning) untuk segmentasi data mahasiswa ke dalam klaster (K=2, 3, 4) dengan evaluasi Davies-Bouldin Index (DBI) terendah sebagai acuan klaster terbaik.
   - Tahap 2: Artificial Neural Network - Backpropagation Multilayer Perceptron / MLP Classifier (Supervised Learning) yang dilatih menggunakan pseudo-label dari klaster terbaik untuk memprediksi kelayakan berkas baru.
   
2. Fitur Data (6 Fitur Numerik):
   - IPK (0.00 - 4.00)
   - Penghasilan Orang Tua (Rupiah/bulan)
   - Jumlah Tanggungan Keluarga
   - Skor Prestasi Akademik (0 - 100)
   - Skor Prestasi Non-Akademik (0 - 100)
   - Persentase Kehadiran Kuliah (0 - 100%)
   *Catatan: NIM dan Nama mahasiswa hanya sebagai identitas tampilan, tidak dimasukkan ke dalam model ML.

3. Tech Stack:
   - Frontend: React 19, Vite, Redux Toolkit, CSS Registrar Theme (Figtree typography, deep teal aesthetic).
   - Backend: FastAPI (Python), Scikit-Learn, Pandas, SQLAlchemy, Pydantic v2, Bcrypt, JWT.
   - Database: MySQL 8.0 (9 tabel: users, dataset_batches, student_records, preprocessing_runs, clustering_runs, cluster_assignments, model_versions, predictions, audit_logs).

4. Fitur Utama:
   - Manajemen Dataset & Batch Import (CSV/Excel) dengan validasi skema.
   - Preprocessing KDD (Imputasi Median/Mean & Normalisasi Min-Max/StandardScaler).
   - Eksperimen K-Means multi-K, kalkulasi DBI, dan seleksi klaster optimal.
   - Pelatihan Backpropagation MLP, monitoring status, dan penetapan Active Ready Model.
   - Dashboard analitis, evaluasi Confusion Matrix & F1-score, simulasi prediksi real-time, ekspor laporan CSV, dan RBAC User Management.

Mohon berikan analisis/saran/jawaban berdasarkan konteks sistem di atas: [Tuliskan pertanyaan spesifik Anda di sini]
```
