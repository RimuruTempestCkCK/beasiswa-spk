# Sistem Pendukung Keputusan Seleksi Penerima Beasiswa
### Kombinasi Metode K-Means Clustering & Backpropagation Neural Network

Aplikasi Sistem Pendukung Keputusan (SPK) berbasis web untuk seleksi penerima beasiswa menggunakan **K-Means Clustering** (pengelompokan data tanpa label) dan **Artificial Neural Network Backpropagation (Multi-Layer Perceptron)** untuk prediksi rekomendasi kelayakan berbasis 6 indikator kriteria.

---

## ⚠️ Disclaimer Ilmiah & Akademik

Hasil komputasi sistem ini merupakan **rekomendasi analitis pendukung keputusan** berbasis pola matematis (K-Means & Backpropagation). Keputusan mutlak pemberian beasiswa tetap berada pada wewenang panitia pengelola beasiswa setelah proses verifikasi berkas faktual.

---

## 🛠️ Stack Teknologi

| Komponen | Spesifikasi & Teknologi |
|---|---|
| **Frontend** | React 19, Vite, React Router, Redux Toolkit, Chart.js, Bootstrap 5 UI |
| **Backend** | Python 3.10+ / 3.14, FastAPI, SQLAlchemy ORM, Uvicorn, Pydantic |
| **Machine Learning** | scikit-learn (K-Means, MLPClassifier, MinMaxScaler), Joblib, NumPy, Pandas |
| **Database** | MySQL 8.0 (XAMPP / Standalone) |
| **Port Default** | Frontend: `http://localhost:3001` · Backend: `http://localhost:8000` |

---

## 📌 6 Indikator Kanonis Penilaian

Sistem beroperasi secara konsisten menggunakan 6 fitur evaluasi:
1. **IPK** (Indeks Prestasi Kumulatif): Rentang $0.00 - 4.00$
2. **Penghasilan Orang Tua**: Nilai nominal Rupiah (Rp)
3. **Jumlah Tanggungan Keluarga**: Jumlah anggota keluarga yang ditanggung
4. **Skor Prestasi Akademik**: Bobot prestasi perlombaan / kejuaraan ilmiah ($0 - 4$)
5. **Skor Prestasi Non-Akademik**: Bobot prestasi minat, bakat, & seni ($0 - 4$)
6. **Persentase Kehadiran**: Kehadiran perkuliahan mahasiswa ($0\% - 100\%$)

---

## 🚀 Panduan Lengkap Cara Menjalankan Aplikasi

### 1. Database (MySQL / XAMPP)
1. Buka aplikasi **XAMPP Control Panel**, lalu aktifkan modul **MySQL** (Start pada port `3306`).
2. Buat database baru bernama `beasiswa_spk`:
   - Bisa melalui browser: `http://localhost/phpmyadmin` $\rightarrow$ klik **New** $\rightarrow$ beri nama `beasiswa_spk` $\rightarrow$ klik **Create**.
3. **Auto-Seed Otomatis**:
   - Skema tabel, akun pengguna default, dan 50 data awal mahasiswa **akan dibuat secara otomatis oleh backend** saat pertama kali dijalankan. Anda tidak perlu import file SQL secara manual.

---

### 2. Menjalankan Backend (FastAPI)
Buka terminal baru (PowerShell / Command Prompt) di direktori utama:

```powershell
# 1. Masuk ke direktori backend
cd backend

# 2. Buat & aktifkan virtual environment (jika belum ada)
python -m venv venv
venv\Scripts\activate

# 3. Install dependency Python
pip install -r requirements.txt

# 4. Pastikan file .env sesuai dengan konfigurasi database lokal Anda
# Default database: mysql+pymysql://root:password@localhost:3306/beasiswa_spk
# (Jika root MySQL Anda tanpa password, ubah menjadi: root:@localhost:3306/beasiswa_spk)

# 5. Jalankan server FastAPI
uvicorn app.main:app --reload --port 8000
```
- API Backend berjalan di: `http://127.0.0.1:8000`
- Dokumentasi Interaktif Swagger UI: `http://127.0.0.1:8000/docs`

---

### 3. Menjalankan Frontend (React + Vite)
Buka terminal kedua (PowerShell terpisah) di direktori utama:

```powershell
# 1. Masuk ke direktori frontend
cd frontend

# 2. Install package node modules (jika belum ada)
npm install

# 3. Jalankan server development Vite
npm run dev
```
- Aplikasi Web dapat diakses di: **`http://localhost:3001`** (atau `http://localhost:5173`)

---

## 👥 Akun Login Bawaan (Role-Based Access)

Sistem telah dilengkapi dengan otentikasi JWT dan 3 tingkatan peran (*Role*):

| Role | Email Login | Password Default | Hak Akses & Tugas |
|---|---|---|---|
| **Administrator** | `admin@beasiswa.local` | `admin123` | Akses penuh: Kelola semua modul, manajemen user, reset password, dan hapus dataset. |
| **Operator** | `operator@beasiswa.local` | `admin123` | Operasional: Input/import dataset, normalisasi preprocessing, training model, dan input prediksi mahasiswa baru. |
| **Reviewer** | `reviewer@beasiswa.local` | `admin123` | Penelaah: Melihat data pendaftar (*read-only*), evaluasi model, menelaah laporan akhir, serta mencetak PDF / ekspor CSV. |

---

## 🔄 Alur Kerja Operasional Sistem

```
[Import/Batch Dataset] 
       ↓
[Preprocessing] (Pembersihan Missing Value & Normalisasi Min-Max)
       ↓
[Clustering K-Means] (Eksperimen K=2, 3, 4 & Pilih Model Acuan Berdasarkan Skor DBI Terendah)
       ↓
[Training Backpropagation] (Pelatihan Neural Network MLP & Set Ready Status)
       ↓
[Evaluasi Model] (Pemeriksaan Akurasi, Precision, Recall, & Confusion Matrix)
       ↓
[Prediksi Kelayakan] (Inferensi Rekomendasi Mahasiswa Baru & Confidence Score)
       ↓
[Laporan & Rekomendasi] (Pemeringkatan Keputusan Beasiswa, Cetak PDF, Ekspor CSV)
```

---

## 📂 Struktur Direktori Proyek

```
beasiswa-spk/
├── README.md                      # Panduan lengkap instalasi dan operasional sistem
├── .gitignore                     # Aturan ignore file git
├── docs/                          # Dokumentasi sistem, metodologi, dan prompt spreadsheet
│   ├── ALUR_SISTEM_DAN_PANDUAN.md
│   └── PROMPT_SPREADSHEET_SPK_BEASISWA.txt
├── backend/                       # Service Backend (Python FastAPI)
│   ├── app/
│   │   ├── api/                   # Route endpoints API
│   │   ├── core/                  # Konfigurasi keamanan JWT & database
│   │   ├── db/                    # Session & Auto-seed generator
│   │   ├── ml/                    # Logika algoritma K-Means & Backpropagation
│   │   ├── models/                # Model tabel database SQLAlchemy
│   │   ├── repositories/          # Akses query database
│   │   └── services/              # Logika bisnis SPK
│   ├── artifacts/                 # Tempat penyimpanan joblib model terlatih
│   └── requirements.txt           # Daftar library Python
└── frontend/                      # User Interface (React 19 + Vite)
    ├── src/
    │   ├── features/              # Modul halaman (Dashboard, Datasets, Preprocessing, dll)
    │   ├── Layout/                # Komponen layout (Sidebar dinamis per role, Topbar, Footer)
    │   └── services/              # Client API axios & endpoints
    ├── package.json
    └── vite.config.js
```
