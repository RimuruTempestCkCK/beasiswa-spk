# Dokumentasi Metode Algoritma

## Kerangka KDD (Knowledge Discovery in Databases)

| Tahap | Aktivitas | Output |
|---|---|---|
| Selection | Memilih 6 kolom fitur; mengecualikan identifier | Dataset terpilih |
| Cleaning | Cek missing, duplikat, tipe salah, nilai di luar rentang | Dataset valid |
| Transformation | Normalisasi fitur numerik (MinMaxScaler) | Matriks fitur + transformasi tersimpan |
| Data Mining | K-Means clustering; Backpropagation klasifikasi label cluster | Label cluster + model |
| Evaluation | DBI untuk cluster; confusion matrix, accuracy, precision, recall, F1 | Ringkasan evaluasi |
| Presentation | Dashboard, grafik, laporan | Informasi untuk penelaahan |

---

## 1. Preprocessing

### Missing Value Handling
- Imputasi dengan **median** per fitur (dihitung dari data training saja)
- Median disimpan dalam config artifact untuk konsistensi di prediksi

### Normalisasi
- **MinMaxScaler**: transformasi ke rentang [0, 1]
- Formula: `x_norm = (x - x_min) / (x_max - x_min)`
- Fit **hanya** pada data training
- Diterapkan ke data test dan data prediksi baru
- Scaler disimpan sebagai artifact bersama model

---

## 2. K-Means Clustering

### Algoritma
```
Input: X_normalized (n_samples × 6), k, random_seed

1. Inisialisasi k centroid secara acak (k-means++)
2. Ulangi hingga konvergen:
   a. Assign setiap sample ke centroid terdekat (Euclidean distance)
   b. Update centroid = mean semua sample dalam cluster
3. Hitung DBI
4. Simpan: labels, centroids, DBI, distances
```

### Davies-Bouldin Index (DBI)
```
DBI = (1/k) * Σ_i max_{j≠i} [(σ_i + σ_j) / d(c_i, c_j)]

Di mana:
- σ_i = rata-rata jarak sample ke centroid cluster i
- d(c_i, c_j) = jarak antara centroid cluster i dan j
- Nilai DBI lebih rendah = pemisahan cluster relatif lebih baik
```

### Pemilihan K
- Jalankan K-Means untuk beberapa kandidat K
- Bandingkan DBI antar kandidat
- Pilih berdasarkan DBI **dan** tinjauan profil cluster (domain expert)
- DBI saja tidak membuktikan kelayakan beasiswa

---

## 3. Backpropagation (MLP Classifier)

### Arsitektur
- Input: 6 fitur (sudah dinormalisasi)
- Hidden layers: konfigurabel (default: [64, 32])
- Output: jumlah cluster K (softmax)
- Activation: ReLU (default)
- Optimizer: Adam (via scikit-learn MLPClassifier)

### Training
```
Input: X (normalized), y (cluster labels dari K-Means terpilih)

1. Split data: train/test (stratified, default 80/20)
2. Fit MLPClassifier pada data train
3. Early stopping dengan validation_fraction=0.1
4. Evaluasi pada data test (TIDAK digunakan untuk training)
5. Simpan model + scaler sebagai satu artifact
```

### Konfigurasi yang Dicatat
- hidden_layer_sizes
- learning_rate_init
- max_iter
- random_state
- test_size
- activation

---

## 4. Evaluasi

### Metrik Klasifikasi (terhadap label cluster)

| Metrik | Formula | Keterangan |
|---|---|---|
| Accuracy | TP + TN / Total | Proporsi prediksi benar |
| Precision | TP / (TP + FP) | Per kelas, laporkan macro average |
| Recall | TP / (TP + FN) | Per kelas, laporkan macro average |
| F1-Score | 2 × P × R / (P + R) | Rata-rata harmonik P dan R |
| Confusion Matrix | Matriks n×n | Visualisasi prediksi vs aktual |

### Peringatan Interpretasi
- Metrik mengukur kemampuan meniru label cluster, **bukan** akurasi terhadap keputusan resmi
- Kelas cluster tidak seimbang → laporkan per-kelas dan macro-F1
- Jangan interpretasikan cluster sebagai "layak/tidak layak" tanpa validasi domain

---

## 5. Anti Data Leakage

1. Normalisasi di-fit pada **data training** saja
2. Data test hanya di-transform (tidak di-fit)
3. Jangan pilih model berdasarkan performa data test
4. Seed semua proses acak untuk reproduktibilitas

---

## 6. Versioning Artifact

Setiap model version menyimpan:
- File model (joblib): bobot MLP
- File scaler (joblib): parameter MinMaxScaler
- File config (JSON): konfigurasi training + preprocessing
- Referensi ke clustering_run_id yang digunakan
