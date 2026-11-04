# SPK Seleksi Beasiswa Universitas Dharma Andalas (K-Means & Backpropagation)

Sistem Pendukung Keputusan (SPK) berbasis web untuk menentukan rekomendasi kelayakan penerima beasiswa Universitas Dharma Andalas berdasarkan **Kerangka Penelitian Gambar 3.1** menggunakan **5 Variabel Penelitian** dengan kombinasi algoritma **K-Means Clustering (Davies-Bouldin Index)** dan **Artificial Neural Network Backpropagation (MLP)**.

---

## 5 Variabel Penelitian (Gambar 3.1)
1. **Nilai Rata Akhir / IPS** (`ipk`) — Rentang numerik desimal `0.00` - `4.00`
2. **Penghasilan Orang Tua** (`parent_income`) — Nilai numerik Rupiah per bulan ($\ge 0$)
3. **Jumlah Tanggungan Keluarga / Jumlah Saudara** (`family_dependents`) — Nilai numerik bulat ($\ge 0$)
4. **Prestasi Akademik** (`academic_achievement_score`) — Skala biner: `1` (Ada Prestasi), `0` (Tidak Ada Prestasi)
5. **Prestasi Non-Akademik** (`nonacademic_achievement_score`) — Skala biner: `1` (Ada Prestasi), `0` (Tidak Ada Prestasi)

---

## Cara Menjalankan Aplikasi

### 1. Database (MySQL / XAMPP)
1. Buka **XAMPP Control Panel**, lalu klik **Start** pada modul **MySQL** (Port `3306`).
2. Buat database baru bernama `beasiswa_spk` melalui phpMyAdmin (`http://localhost/phpmyadmin`).
3. *(Skema tabel, akun user, dan data awal otomatis di-seed oleh backend saat pertama kali dijalankan).*

---

### 2. Jalankan Backend (FastAPI)
Buka terminal (PowerShell / Command Prompt) di folder proyek:

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- **Backend API**: `http://127.0.0.1:8000`
- **Swagger Docs**: `http://127.0.0.1:8000/docs`

---

### 3. Jalankan Frontend (React + Vite)
Buka terminal baru:

```powershell
cd frontend
npm install
npm run dev
```
- **Aplikasi Web**: `http://localhost:3001` (atau `http://localhost:5173`)

---

## Akun Login Bawaan

| Role | Email Login | Password | Hak Akses |
|---|---|---|---|
| **Admin** | `admin@beasiswa.local` | `admin123` | Akses penuh semua menu, kelola user, dan hapus dataset. |
| **Operator** | `operator@beasiswa.local` | `admin123` | Upload dataset, preprocessing, training model, dan uji prediksi. |
| **Reviewer** | `reviewer@beasiswa.local` | `admin123` | *Read-only*: Melihat data mahasiswa, menelaah laporan, serta cetak PDF / ekspor CSV. |

---

## Alur Penggunaan Sistem Sesuai Metodologi (Gambar 3.1)

```
1. Data Awal        → Upload file Excel/CSV data historis pendaftar beasiswa Undha.
2. Preprocessing    → Data Cleaning, Transformasi nominal/biner, dan Normalisasi Min-Max [0, 1].
3. K-Means (DBI)    → Eksperimen klaster K=2, 3, 4, 5 & memilih K optimal dengan DBI terendah.
4. Backpropagation  → Latih jaringan saraf Backpropagation MLP berdasarkan label klaster K-Means.
5. Evaluasi Model   → Confusion Matrix, Akurasi, Presisi, Recall, dan F1-Score pada data uji (Test 20%).
6. GUI Prediksi     → Uji kelayakan kandidat beasiswa (individual / batch CSV).
7. Laporan SPK      → Pemeringkatan rekomendasi kelayakan penerima beasiswa dan ekspor laporan CSV/PDF.
```
