# CATATAN PERUBAHAN SISTEM (CHANGELOG)
## Penyelarasan Kerangka Penelitian Gambar 3.1 SPK Beasiswa Universitas Dharma Andalas

Dokumen ini mencatat seluruh perubahan teknis, metodologis, dan implementasi kode pada repository SPK Penerima Beasiswa Universitas Dharma Andalas untuk mematuhi **Gambar 3.1 Kerangka Penelitian**.

---

## 1. Ringkasan Perubahan Utama

1. **Penerapan Tepat 5 Variabel Penelitian**:
   - Menghapus ketergantungan wajib pada variabel kehadiran (`attendance_percentage`) dari matriks numerik Machine Learning.
   - Sistem kini murni menggunakan 5 indikator:
     1. Nilai Rata-rata Akhir / IPS (`ipk`)
     2. Penghasilan Orang Tua (`parent_income`)
     3. Jumlah Tanggungan Keluarga / Saudara (`family_dependents`)
     4. Prestasi Akademik (`academic_achievement_score`, biner $0/1$)
     5. Prestasi Non-Akademik (`nonacademic_achievement_score`, biner $0/1$)
2. **Automated Raw Cleaner (Import Langsung Excel Mentah)**:
   - Dibuat modul [backend/app/ml/raw_data_cleaner.py](file:///C:/Users/Maxtop/Downloads/beasiswa-spk/backend/app/ml/raw_data_cleaner.py) yang diintegrasikan langsung pada endpoint import dataset.
   - Pengguna dapat mengunggah file `Data Awal beasiswa.xlsx` langsung melalui antarmuka web tanpa perlu menjalankan skrip konverter manual.
   - Modul otomatis mengonversi teks nominal (`<1jt`, `<2jt`, dll.) ke Rupiah, mengekstrak angka tanggungan (`4 Orang` $\rightarrow 4$), memetakan prestasi biner ($0$ atau $1$), dan menyaring 325 data kosong tanpa IPS (menghasilkan 416 baris data valid).
3. **Penyelarasan Algoritma & Evaluasi (K-Means DBI + Backpropagation)**:
   - K-Means dijalankan pada data Min-Max $[0.0, 1.0]$ dengan kandidat $K \in [2, 3, 4, 5]$.
   - $K=2$ terpilih secara dinamis sebagai K optimal dengan nilai Davies-Bouldin Index (DBI) terendah ($0.2761$).
   - JST Backpropagation MLP dilatih menggunakan label klaster K=2 dengan pembagian Stratified 80:20 (332 data latih, 84 data uji), menghasilkan Confusion Matrix $[[68, 0], [0, 16]]$ dan Akurasi 100%.
4. **Pembersihan Antarmuka Pengguna (GUI) & Laporan**:
   - Kolom kehadiran telah dihilangkan dari form input manual, form prediksi tunggal, tabel riwayat prediksi, tabel profil klaster, dan halaman laporan rekomendasi beasiswa.
   - Ekspor laporan CSV dan cetak PDF kini menyajikan 5 variabel penelitian + metadata identitas mahasiswa.

---

## 2. Rincian Berkas yang Diubah / Ditambahkan

### A. Backend & Machine Learning
- **`backend/app/ml/raw_data_cleaner.py`** *(Berkas Baru)*:
  Parser regex otomatis untuk membersihkan data mentah dari variasi string nominal, jumlah orang pada tanggungan, koma desimal IPS, dan indikator biner prestasi.
- **`backend/app/services/dataset_service.py`**:
  Integrasi `clean_and_transform_raw_dataset` pada metode `import_file` dan penyesuaian serialisasi `list_records`.
- **`backend/app/ml/data_validation.py`**:
  Memperbarui `REQUIRED_FEATURES` menjadi tepat 5 variabel dan mengizinkan rentang `parent_income >= 0.0`.
- **`backend/app/ml/preprocessing.py`**:
  Memastikan normalisasi Min-Max hanya memproses 5 variabel penelitian.
- **`backend/app/services/clustering_service.py`**:
  Menghilangkan kolom kehadiran saat mengekstrak fitur untuk K-Means.
- **`backend/app/services/training_service.py`**:
  Menghilangkan kolom kehadiran saat menyiapkan matriks fitur untuk pelatihan Backpropagation.
- **`backend/app/services/prediction_service.py`**:
  Menghilangkan kehadiran dari fitur inferensi prediksi tunggal maupun upload batch CSV.
- **`backend/app/schemas/prediction.py`**:
  Menyesuaikan skema Pydantic request/response agar selaras dengan 5 variabel penelitian.
- **`backend/app/models/prediction.py`**:
  Menjadikan kolom `attendance_percentage` bersifat `nullable=True` pada ORM untuk menjaga kompatibilitas database tanpa migrasi destruktif.
- **`backend/app/api/v1/endpoints/reports.py`**:
  Menghapus kolom kehadiran dari payload rekomendasi dan ekspor file CSV.

### B. Frontend (React)
- **`frontend/src/features/predictions/PredictionsPage.jsx`**:
  Menghapus input form kehadiran, menghapus kolom kehadiran di tabel riwayat keputusan, dan memperbarui badge status klaster $K=2$.
- **`frontend/src/features/reports/ReportsPage.jsx`**:
  Menghapus kolom kehadiran dari tabel pemeringkatan SPK dan modal detail mahasiswa.
- **`frontend/src/features/clustering/ClusteringPage.jsx`**:
  Menghapus rata-rata kehadiran dari tabel profil klaster.
- **`frontend/src/features/datasets/DatasetDetailPage.jsx`**:
  Menghapus input kehadiran dan menyesuaikan dropdown prestasi dengan biner ($0/1$).

### C. Dokumentasi & Sampel Data
- **`README.md`**:
  Memperbarui penjelasan sistem dari 6 indikator kriteria menjadi 5 variabel penelitian Universitas Dharma Andalas sesuai Gambar 3.1.
- **`dataset_samples/README.md`**:
  Dokumentasi struktur kolom 5 variabel dan petunjuk impor data.
- **`dataset_samples/dataset_beasiswa_penelitian_5_variabel.csv`** & **`.xlsx`**:
  Dataset bersih acuan 416 data mahasiswa hasil konversi dari `Data Awal beasiswa.xlsx`.

---

## 3. Hasil Pengujian Aktual

- **Data Mentah Awal**: 741 baris
- **Data Valid Hasil Cleaning**: 416 baris
- **Evaluasi DBI (Davies-Bouldin Index)**:
  - $K = 2 \rightarrow \mathbf{0.2761}$ *(Terendah / Optimal)*
  - $K = 3 \rightarrow 0.7077$
  - $K = 4 \rightarrow 0.8334$
  - $K = 5 \rightarrow 0.7790$
- **K Optimal Terpilih**: $K = 2$
- **Evaluasi JST Backpropagation (MLP)**:
  - Data Uji (Testing 20%): 84 data
  - Akurasi: $1.0000$ ($100\%$)
  - Precision (Macro): $1.0000$
  - Recall (Macro): $1.0000$
  - F1-Score (Macro): $1.0000$
  - Confusion Matrix:
    $$\begin{bmatrix} 68 & 0 \\ 0 & 16 \end{bmatrix}$$
