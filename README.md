# Sistem Pendukung Keputusan Prediksi Kelayakan Beasiswa

> **Sistem berbasis web** untuk analisis kelayakan beasiswa menggunakan K-Means Clustering dan Backpropagation Neural Network.

## ⚠️ Disclaimer Penting

Hasil sistem ini adalah **prediksi cluster berbasis pola data**, bukan keputusan resmi kelayakan beasiswa. Interpretasi cluster memerlukan validasi domain dari pihak kampus. Keputusan akhir penerimaan beasiswa tetap memerlukan verifikasi kriteria dan otorisasi petugas yang berwenang.

---

## Stack Teknologi

| Komponen | Teknologi |
|---|---|
| Frontend | React 19 + Vite (ArchitectUI template) |
| Backend | Python FastAPI |
| Database | MySQL 8.0 |
| ML | scikit-learn (K-Means, MLP, MinMaxScaler) |

## Metode

- **K-Means Clustering** dengan evaluasi **Davies-Bouldin Index (DBI)**
- **Backpropagation** (MLP Classifier) dengan target = label cluster K-Means
- **6 Fitur Input**: IPK, Penghasilan Orang Tua, Jumlah Tanggungan, Prestasi Akademik, Prestasi Nonakademik, Kehadiran

---

## Cara Menjalankan

### 1. Database (MySQL Lokal)
Pastikan MySQL sudah berjalan di komputer Anda, lalu import skema dan data awal:
```sql
-- Jalankan di MySQL client / phpMyAdmin / DBeaver:
SOURCE database/schema.sql;
SOURCE database/seed_dev.sql;
```

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # sesuaikan DATABASE_URL dan SECRET_KEY
uvicorn app.main:app --reload
```
Akses API Docs: http://localhost:8000/docs

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
cp .env.example .env.local   # konfigurasi VITE_API_URL=http://localhost:8000
npm run dev
```
Akses Aplikasi: http://localhost:5173 (atau port default Vite)

---

## Akun Default (Development)

| Role | Email | Password |
|---|---|---|
| Admin | admin@beasiswa.local | admin123 |
| Operator | operator@beasiswa.local | admin123 |
| Reviewer | reviewer@beasiswa.local | admin123 |

> **Ganti semua password di production!**

---

## Alur Penggunaan

1. **Login** → masuk sebagai admin/operator
2. **Dataset** → buat batch, import CSV/Excel
3. **Preprocessing** → cleaning & normalisasi data
4. **Clustering** → jalankan K-Means beberapa kandidat K, bandingkan DBI
5. **Training** → latih Backpropagation dari label cluster terpilih
6. **Evaluasi** → lihat confusion matrix dan metrik
7. **Prediksi** → masukkan data baru, dapatkan cluster prediksi
8. **Laporan** → ekspor hasil

---

## Struktur Direktori

```
beasiswa-spk/
├── README.md
├── CHANGELOG.md
├── .gitignore
├── docs/
│   ├── DATA_DICTIONARY.md
│   └── ALGORITHM_METHOD.md
├── frontend/          # React + Vite (ArchitectUI)
├── backend/           # Python FastAPI
└── database/          # SQL schema & seed
```

---

## Dokumentasi

- [Kamus Data](docs/DATA_DICTIONARY.md)
- [Metode Algoritma](docs/ALGORITHM_METHOD.md)
- [Changelog](CHANGELOG.md)
- API Docs: http://localhost:8000/docs (saat server berjalan)
