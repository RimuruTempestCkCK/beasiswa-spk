# FASE D: DOKUMENTASI IMPLEMENTASI TEKNIS & VALIDASI METODOLOGIS
**Sistem Pendukung Keputusan Seleksi Penerima Beasiswa Menggunakan Kombinasi K-Means Clustering dan Artificial Neural Network (Backpropagation MLP)**

---

## 1. STATUS PENGERJAAN MASTER PROMPT (FASE A s/d FASE D)

Seluruh 4 Fase yang diwajibkan dalam Master Prompt telah diselesaikan secara sistematis dan terverifikasi secara fungsional:

| Fase | Deskripsi Tahapan | Status Pengerjaan | Tautan Dokumen Artefak / Kode |
|:---|:---|:---:|:---|
| **Fase A** | **Analisis Metodologi KDD & Data Science** | **SELESAI** | [FASE_A_METODOLOGI_PENELITIAN.md](file:///C:/Users/MSI069/.gemini/antigravity-cli/brain/2639d5c5-8c3d-4970-80b4-f33afd764d4e/FASE_A_METODOLOGI_PENELITIAN.md) |
| **Fase B** | **Rancangan Sistem & Arsitektur Teknis** | **SELESAI** | [FASE_B_RANCANGAN_SISTEM.md](file:///C:/Users/MSI069/.gemini/antigravity-cli/brain/2639d5c5-8c3d-4970-80b4-f33afd764d4e/FASE_B_RANCANGAN_SISTEM.md) |
| **Fase C** | **Implementasi Penuh Backend, Frontend, DB & ML** | **SELESAI & AKTIF** | [GitHub Commit `6a12918`](https://github.com/RimuruTempestCkCK/beasiswa-spk) |
| **Fase D** | **Dokumentasi Implementasi & 17 Kriteria Peneliti** | **SELESAI** | *Dokumen Ini (FASE D)* |

---

## 2. DOKUMENTASI MODUL TEKNIS & PEMETAAN KODE (FASE D)

### Modul 1: Ingestion & Validasi Dataset (Selection & Cleaning)
- **Tujuan:** Mengimpor file CSV/XLSX, memvalidasi rentang 6 fitur numerik, mengisolasi identitas (`student_code`, `student_name`), dan merekam jumlah baris valid vs invalid.
- **Formula Validasi:**
  $$0.00 \le \text{IPK} \le 4.00, \quad \text{Income} \ge 0, \quad 0 \le \text{Dependents} \le 20, \quad 0 \le \text{Scores, Attendance} \le 100$$
- **File Implementasi:**
  - Backend Validator: [`app/ml/data_validation.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/ml/data_validation.py)
  - Endpoint & Service: [`app/api/v1/endpoints/datasets.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/api/v1/endpoints/datasets.py), [`app/services/dataset_service.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/services/dataset_service.py)
  - Frontend Page: [`features/datasets/ImportPage.jsx`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/frontend/src/features/datasets/ImportPage.jsx)
- **Tabel Terlibat:** `dataset_batches`, `student_records`.

---

### Modul 2: Preprocessing KDD & Penskalaan Fitur
- **Tujuan:** Menangani missing values dan menormalisasi skala fitur tanpa kebocoran data.
- **Formula:**
  $$\text{Imputasi: } \tilde{x} = \text{median}(X_{\text{train}}), \quad \text{MinMax: } x' = \frac{x - x_{\min}}{x_{\max} - x_{\min}} \in [0, 1]$$
- **Penyimpanan Artefak:** Objek pipeline diserialisasi menggunakan `joblib` ke `backend/artifacts/preprocessing_{id}_{hash}.joblib`.
- **File Implementasi:**
  - Logic ML: [`app/ml/preprocessing.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/ml/preprocessing.py)
  - Endpoint & Service: [`app/api/v1/endpoints/preprocessing.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/api/v1/endpoints/preprocessing.py), [`app/services/preprocessing_service.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/services/preprocessing_service.py)
  - Frontend Page: [`features/preprocessing/PreprocessingPage.jsx`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/frontend/src/features/preprocessing/PreprocessingPage.jsx)
- **Tabel Terlibat:** `preprocessing_runs`.

---

### Modul 3: K-Means Clustering & Evaluasi Davies-Bouldin Index (DBI)
- **Tujuan:** Mengelompokkan data terstandarisasi untuk $K \in \{2, 3, 4\}$, menghitung DBI, dan menyajikan profil centroid untuk interpretasi manusia (*pseudo-labeling*).
- **Formula Davies-Bouldin Index:**
  $$R_{ij} = \frac{s_i + s_j}{d(c_i, c_j)}, \quad \text{DBI} = \frac{1}{K} \sum_{i=1}^K \max_{j \ne i} R_{ij}$$
- **File Implementasi:**
  - Logic ML: [`app/ml/clustering.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/ml/clustering.py)
  - Endpoint & Service: [`app/api/v1/endpoints/clustering.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/api/v1/endpoints/clustering.py), [`app/services/clustering_service.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/services/clustering_service.py)
  - Frontend Page: [`features/clustering/ClusteringPage.jsx`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/frontend/src/features/clustering/ClusteringPage.jsx)
- **Tabel Terlibat:** `clustering_runs`, `cluster_assignments`.

---

### Modul 4: Pelatihan Model Backpropagation MLP
- **Tujuan:** Melatih jaringan saraf tiruan terawasi (*supervised*) menggunakan pseudo-label klaster terpilih dengan stratified train/test split (80:20).
- **Formula Backpropagation:**
  $$\text{Loss Cross-Entropy: } \mathcal{L} = -\frac{1}{N} \sum_{i=1}^N [y_i \ln \hat{y}_i + (1 - y_i) \ln (1 - \hat{y}_i)]$$
  $$\text{Update Bobot: } W^{(l)} \leftarrow W^{(l)} - \eta \frac{\partial \mathcal{L}}{\partial W^{(l)}} - \alpha W^{(l)}$$
- **File Implementasi:**
  - Logic ML: [`app/ml/training.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/ml/training.py), [`app/ml/evaluation.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/ml/evaluation.py)
  - Endpoint & Service: [`app/api/v1/endpoints/training.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/api/v1/endpoints/training.py), [`app/services/training_service.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/services/training_service.py)
  - Frontend Page: [`features/training/TrainingPage.jsx`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/frontend/src/features/training/TrainingPage.jsx), [`features/evaluation/EvaluationPage.jsx`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/frontend/src/features/evaluation/EvaluationPage.jsx)
- **Tabel Terlibat:** `model_versions`.

---

### Modul 5: Inferensi Real-Time Mahasiswa Baru
- **Tujuan:** Menerima berkas mahasiswa baru, melakukan normalisasi menggunakan artefak pipeline (tanpa fit ulang), menghasilkan probabilitas dan rekomendasi awal.
- **File Implementasi:**
  - Endpoint: [`app/api/v1/endpoints/predictions.py`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/backend/app/api/v1/endpoints/predictions.py)
  - Frontend Page: [`features/predictions/PredictionsPage.jsx`](file:///D:/DOWNLOAD%20FOLDER/beasiswa-spk/frontend/src/features/predictions/PredictionsPage.jsx)
- **Tabel Terlibat:** `predictions`.

---

## 3. JAWABAN ILMIAH TERHADAP 17 KRITERIA HASIL AKHIR PENELITI

Berikut adalah pembuktian ilmiah untuk menjawab seluruh 17 pertanyaan pada Bagian 17 Master Prompt:

1. **Data mahasiswa berasal dari mana?**  
   Data diimpor melalui berkas CSV/Excel resmi dari Biro Kemahasiswaan / SIAKAD perguruan tinggi. Pada tahap pengembangan/pengujian teknis, digunakan data simulasi bertanda eksplisit `[DEV]` (*Dataset Sintetis 2026*).
2. **Apa arti setiap atribut dan bagaimana nilainya divalidasi?**  
   6 atribut numerik mencakup: IPK ($0–4$), Penghasilan Orang Tua ($\ge 0$), Tanggungan ($0–20$), Skor Prestasi Akademik ($0–100$), Skor Prestasi Non-Akademik ($0–100$), dan Kehadiran ($0–100\%$). Validasi ditegakkan pada tingkat skema backend Pydantic & modul `data_validation.py`.
3. **Bagaimana data mentah diubah menjadi fitur numerik?**  
   Atribut identitas (`student_code`, `student_name`) diekstraksi ke kolom metadata. Nilai kosong diimputasi menggunakan median batch (khusus prestasi kosong diberi default $0.0$), lalu dikonversi menjadi matriks float $N \times 6$.
4. **Mengapa scaling tertentu dipilih?**  
   Dipilih **Min-Max Normalization** ($[0, 1]$) karena fitur memiliki batas alami yang jelas (misal IPK maks 4.0, persentase maks 100%), serta menghindari dominasi fitur berorde jutaan rupiah (`parent_income`) atas fitur berorde satuan.
5. **Bagaimana $K = 2, 3,$ dan $4$ dibandingkan?**  
   Sistem mengeksekusi 3 eksperimen K-Means dengan random seed yang sama (`seed=42`). Tiap konfigurasi dicatat nilai Davies-Bouldin Index (DBI), profil centroid, dan sebaran anggota klasternya.
6. **Bagaimana DBI dihitung dan digunakan?**  
   DBI mengukur rasio *within-cluster scatter* terhadap *between-cluster separation*. Nilai DBI terkecil dipilih sebagai klaster dengan kualitas pemisahan matematis terbaik.
7. **Mengapa suatu klaster diinterpretasikan sebagai kelompok prioritas?**  
   Klaster dengan karakteristik rata-rata IPK tinggi, prestasi tinggi, kehadiran tinggi, dipadukan dengan penghasilan orang tua rendah dan tanggungan banyak secara substantif memenuhi kriteria prioritas beasiswa.
8. **Siapa atau aturan apa yang menyetujui pseudo-label?**  
   Operator seleksi / pakar beasiswa melakukan verifikasi profil centroid melalui tombol **"Pilih Klaster Rujukan"** (`POST /clustering/runs/{id}/select`), dicatat dalam audit trail.
9. **Bagaimana pseudo-label membentuk target MLP?**  
   Label klaster terpilih ($c_i \in \{0, 1\}$) dipetakan menjadi target biner $y \in \{0, 1\}$, sedangkan kasus batas ditandai `perlu_review` dan diisolasi dari target training biner.
10. **Bagaimana mencegah data leakage?**  
    Pemisahan Train/Test Split (80:20) dilakukan *sebelum* pembelajaran model. Pipeline normalisasi di-fit HANYA pada data latih $80\%$ dan ditransformasikan secara pasif ke data uji $20\%$.
11. **Bagaimana kualitas MLP dievaluasi?**  
    Diuji pada data pengujian ($20\%$ unseen data) menggunakan metrik Accuracy, Precision Macro, Recall Macro, F1-Score Macro, dan Confusion Matrix.
12. **Apa yang sebenarnya dibuktikan oleh Accuracy, Precision, Recall, dan F1-Score?**  
    Metrik tersebut membuktikan **fidelity (kemampuan replikasi pola)** model MLP dalam mempelajari batas keputusan yang dibentuk oleh pseudo-label K-Means, **bukan** bukti mutlak kelayakan di dunia nyata.
13. **Bagaimana inferensi mahasiswa baru dilakukan?**  
    Data masukan 6 fitur mahasiswa baru ditransformasikan langsung oleh objek artefak preprocessing `.joblib` tanpa proses fit ulang, lalu diklasifikasikan oleh artefak model aktif berstatus `ready`.
14. **Bagaimana sistem menjaga konsistensi preprocessing?**  
    Setiap model versi tersimpan mengunci `preprocessing_run_id` dan path artefak `.joblib` miliknya secara permanen pada tabel `model_versions`.
15. **Bagaimana hasil prediksi ditelusuri ke dataset, eksperimen, dan model?**  
    Setiap baris di tabel `predictions` memiliki foreign key `model_version_id`, yang terhubung ke `clustering_run_id`, `preprocessing_run_id`, hingga `dataset_batch_id`.
16. **Apa keterbatasan sistem sebelum label aktual tersedia?**  
    Validitas empiris keputusan beasiswa belum terbukti secara riil di lapangan. Sistem bertindak murni sebagai sistem pendukung (*decision support tool*) berbasis kemiripan karakteristik.
17. **Bagaimana model dapat divalidasi terhadap keputusan panitia yang nyata?**  
    Melalui pengujian eksternal di masa depan, yaitu membandingkan hasil rekomendasi model terhadap berkas mahasiswa yang telah diputuskan secara resmi oleh SK Panitia Beasiswa (*ground truth test*).
