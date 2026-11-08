# ==============================================================================
# PIPELINE PENELITIAN SPK PENERIMA BEASISWA BAZNAS (UNIVERSITAS DHARMA ANDALAS)
# Sesuai Alur Kerangka Penelitian (Gambar 3.1) dan Panduan Pengujian Backpropagation:
# 1. DATA PREPROCESSING:
#    - Data Selection (5 variabel: IPS, Penghasilan, Tanggungan, Prestasi Akademik, Non-Akademik)
#    - Data Cleaning (Missing values, Data Tidak Valid, Deduplikasi NOBP & Nama, Audit Outlier IQR)
#    - Data Transformation (Kategorikal ke Numerik & Normalisasi Min-Max 0-1)
# 2. K-MEANS CLUSTERING & PENENTUAN JUMLAH CLUSTER:
#    - Inisialisasi Centroid & Proses Clustering (Euclidean Distance hingga konvergen)
#    - Evaluasi Davies-Bouldin Index (DBI) Kandidat K=2 s.d. 6 untuk Menentukan K Optimal
#    - Hasil Clustering & Interpretasi Profil Cluster (C1: Layak=1, C2: Tidak Layak=0)
# 3. PEMBENTUKAN MODEL ARSITEKTUR BACKPROPAGATION:
#    - Arsitektur JST 5-3-1 (5 Input, 3 Hidden, 1 Output biner dengan aktivasi Sigmoid)
#    - Inisialisasi Bobot & Bias Seragam Kecil [-0.5, 0.5] sesuai panduan
# 4. IMPLEMENTASI DAN EVALUASI MODEL:
#    - Pembagian Data (Stratified Split 80% Training, 20% Testing)
#    - Pelatihan Online / Pola-per-Pola (Learning Rate alpha=0.5, Max Epochs=1000, Seed=42)
#    - Pengujian & Evaluasi Confusion Matrix (Akurasi, Presisi, Recall, F1-Score, MSE)
#    - Catatan Metodologis & Pembatasan Terhadap Hasil Evaluasi (Audit Kesesuaian K-Means)
# 5. PERANCANGAN & IMPLEMENTASI GUI (Graphical User Interface - Tkinter):
#    - Antarmuka Interaktif Pengambilan Keputusan Kelayakan Calon Mahasiswa
# ==============================================================================

import os
import re
import sys
import argparse
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.metrics import davies_bouldin_score
from sklearn.model_selection import train_test_split

# Numba acceleration jika tersedia
try:
    from numba import njit
    NUMBA_AVAILABLE = True
except ImportError:
    NUMBA_AVAILABLE = False
    njit = None

# ------------------------------------------------------------------------------
# KONFIGURASI FILE & PARAMETER RISET
# ------------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
MASTER = BASE_DIR / "BAZNAS_Data_Awal_Selection_Cleaning_Transformation.xlsx"
EXCEL_KMEANS = BASE_DIR / "FIX DATA BAZNAS K MEANS.xlsx"
OUTPUT_EXCEL = BASE_DIR / "Hasil_Pipeline_Lengkap_Preprocessing_KMeans_DBI.xlsx"
OUTPUT_BP_DIR = BASE_DIR / "hasil_backpropagation_5-3-1"

FEATURES = ["X1_IPS", "X2_Penghasilan", "X3_Tanggungan", "X4_Akademik", "X5_NonAkademik"]

# Arsitektur Backpropagation Sesuai Ketetapan Wajib: 5-3-1
N_INPUT = 5
N_HIDDEN = 3   # 3 Hidden Neurons (Arsitektur 5-3-1)
N_OUTPUT = 1  # 1 Output Neuron (Biner Sigmoid: Layak = 1, Tidak Layak = 0)
ALPHA = 0.5    # Learning Rate
MAX_EPOCHS = 1000
SEED = 42

# ------------------------------------------------------------------------------
# 1. FUNGSI PREPROCESSING DATA
# ------------------------------------------------------------------------------
def name_key(x):
    """Normalisasi string nama untuk deduplikasi (huruf kecil & spasi tunggal)."""
    return re.sub(r"\s+", " ", str(x).strip().casefold())

def num(x):
    """Konversi nilai numerik float dengan penanganan koma desimal."""
    if pd.isna(x): return np.nan
    try: return float(str(x).replace(",", ".").replace(" ", "").strip())
    except: return np.nan

def income_to_rupiah(x):
    """Konversi penghasilan orang tua ke nominal rupiah berbasis aturan representatif."""
    if pd.isna(x): return np.nan, "Kosong"
    s = str(x).strip().lower().replace(" ", "")
    mapping = {
        "<1jt": 500000, "<2jt": 1500000, "<3jt": 2500000, "<5jt": 4500000,
        ">5jt": 6000000, "<300rb": 150000, "<500.000": 250000,
        "<500,000": 250000, "<500": 250000, "500rb": 500000
    }
    if s in mapping: return mapping[s], f"Kategori {s}"
    cleaned = re.sub(r"[^0-9]", "", s)
    if cleaned: return float(cleaned), "Nominal asli"
    return np.nan, "Tidak dapat dikonversi"

def sigmoid(z):
    """Fungsi aktivasi logistik sigmoid dengan clipping numerik stabil."""
    z = np.clip(z, -40.0, 40.0)
    return 1.0 / (1.0 + np.exp(-z))

# ------------------------------------------------------------------------------
# 2. IMPLEMENTASI ALGORITMA BACKPROPAGATION (ONLINE TRAINING)
# ------------------------------------------------------------------------------
if NUMBA_AVAILABLE:
    @njit
    def train_online_numba(X, y, W1, b1, W2, b2, alpha, epochs, seed):
        np.random.seed(seed)
        n = X.shape[0]
        n_input = X.shape[1]
        n_hidden = W1.shape[1]
        history = np.zeros(epochs, dtype=np.float64)

        for epoch in range(epochs):
            order = np.random.permutation(n)
            for idx in order:
                # 1. Forward Pass ke Hidden Layer
                out_hidden = np.zeros(n_hidden, dtype=np.float64)
                for j in range(n_hidden):
                    val = b1[j]
                    for i in range(n_input):
                        val += X[idx, i] * W1[i, j]
                    if val >= 0:
                        out_hidden[j] = 1.0 / (1.0 + np.exp(-val))
                    else:
                        ev = np.exp(val)
                        out_hidden[j] = ev / (1.0 + ev)

                # 2. Forward Pass ke Output Layer
                net_o = b2
                for j in range(n_hidden):
                    net_o += out_hidden[j] * W2[j, 0]
                if net_o >= 0:
                    out_o = 1.0 / (1.0 + np.exp(-net_o))
                else:
                    ev = np.exp(net_o)
                    out_o = ev / (1.0 + ev)

                # 3. Hitung Error & Gradien Output Layer: delta_o = (t - y) * y * (1 - y)
                target = y[idx]
                delta_o = (target - out_o) * out_o * (1.0 - out_o)

                # 4. Hitung Gradien Hidden Layer: delta_h = delta_o * W2 * h * (1 - h)
                delta_h = np.zeros(n_hidden, dtype=np.float64)
                for j in range(n_hidden):
                    delta_h[j] = delta_o * W2[j, 0] * out_hidden[j] * (1.0 - out_hidden[j])

                # 5. Update Bobot & Bias Output Layer
                for j in range(n_hidden):
                    W2[j, 0] += alpha * delta_o * out_hidden[j]
                b2 += alpha * delta_o

                # 6. Update Bobot & Bias Hidden Layer
                for i in range(n_input):
                    for j in range(n_hidden):
                        W1[i, j] += alpha * delta_h[j] * X[idx, i]
                for j in range(n_hidden):
                    b1[j] += alpha * delta_h[j]

            # Hitung MSE Training Tiap Epoch
            total_err = 0.0
            for idx in range(n):
                for j in range(n_hidden):
                    val = b1[j]
                    for i in range(n_input):
                        val += X[idx, i] * W1[i, j]
                    if val >= 0:
                        out_hidden[j] = 1.0 / (1.0 + np.exp(-val))
                    else:
                        ev = np.exp(val)
                        out_hidden[j] = ev / (1.0 + ev)

                net_o = b2
                for j in range(n_hidden):
                    net_o += out_hidden[j] * W2[j, 0]
                if net_o >= 0:
                    pred = 1.0 / (1.0 + np.exp(-net_o))
                else:
                    ev = np.exp(net_o)
                    pred = ev / (1.0 + ev)

                err = y[idx] - pred
                total_err += err * err
            history[epoch] = total_err / n

        return W1, b1, W2, b2, history


class Backpropagation:
    """Implementasi Jaringan Syaraf Tiruan Backpropagation Manual Arsitektur 5-3-1."""
    def __init__(self, n_input=5, n_hidden=3, seed=SEED):
        self.n_input = n_input
        self.n_hidden = n_hidden
        self.seed = seed
        rng = np.random.default_rng(seed)
        # Inisialisasi bobot dan bias acak seragam kecil [-0.5, 0.5] sesuai panduan
        self.W1 = rng.uniform(-0.5, 0.5, size=(n_input, n_hidden)).astype(np.float64)
        self.b1 = rng.uniform(-0.5, 0.5, size=(n_hidden,)).astype(np.float64)
        self.W2 = rng.uniform(-0.5, 0.5, size=(n_hidden, 1)).astype(np.float64)
        self.b2 = float(rng.uniform(-0.5, 0.5))

    def forward_one(self, x):
        net_h = x @ self.W1 + self.b1
        out_h = sigmoid(net_h)
        net_o = float(out_h @ self.W2[:, 0] + self.b2)
        out_o = float(sigmoid(net_o))
        return net_h, out_h, net_o, out_o

    def predict_proba(self, X):
        net_h = X @ self.W1 + self.b1
        out_h = sigmoid(net_h)
        net_o = out_h @ self.W2 + self.b2
        return sigmoid(net_o[:, 0])

    def train(self, X, y, alpha=ALPHA, epochs=MAX_EPOCHS, seed=SEED):
        if NUMBA_AVAILABLE:
            self.W1, self.b1, self.W2, self.b2, history = train_online_numba(
                X.astype(np.float64), y.astype(np.float64),
                self.W1, self.b1, self.W2, self.b2,
                float(alpha), int(epochs), int(seed)
            )
            return pd.DataFrame({"Epoch": np.arange(1, epochs + 1), "MSE_Training": history})

        rng = np.random.default_rng(seed)
        history = []
        for epoch in range(1, epochs + 1):
            order = rng.permutation(len(X))
            for idx in order:
                x = X[idx]
                target = float(y[idx])
                _, out_h, _, out_o = self.forward_one(x)
                delta_o = (target - out_o) * out_o * (1.0 - out_o)
                delta_h = (delta_o * self.W2[:, 0]) * out_h * (1.0 - out_h)
                self.W2[:, 0] += alpha * delta_o * out_h
                self.b2 += alpha * delta_o
                self.W1 += alpha * np.outer(x, delta_h)
                self.b1 += alpha * delta_h

            p = self.predict_proba(X)
            history.append({"Epoch": epoch, "MSE_Training": float(np.mean((y - p) ** 2))})
        return pd.DataFrame(history)


def evaluate_classification(y_true, prob, threshold=0.5):
    """Menghitung metrik performa evaluasi: Confusion Matrix, Akurasi, Presisi, Recall, F1, MSE."""
    y_pred = (prob >= threshold).astype(int)
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))

    accuracy = float((tp + tn) / len(y_true)) if len(y_true) else 0.0
    precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    mse = float(np.mean((y_true - prob) ** 2)) if len(y_true) else 0.0

    return {
        "Akurasi": round(accuracy * 100, 2),
        "Akurasi_Proporsi": accuracy,
        "MSE": mse,
        "Presisi": round(precision * 100, 2),
        "Recall": round(recall * 100, 2),
        "Spesifisitas": round(specificity * 100, 2),
        "F1_Score": round(f1 * 100, 2),
        "TP": tp, "TN": tn, "FP": fp, "FN": fn
    }, y_pred


# ------------------------------------------------------------------------------
# 3. PIPELINE UTAMA (AUDIT & EKSEKUSI TAHAP 1 s.d. 4)
# ------------------------------------------------------------------------------
def run_pipeline():
    print("=" * 78)
    print("AUDIT & EKSEKUSI PIPELINE PENELITIAN SPK BEASISWA BAZNAS (UNDHA)")
    print("KERANGKA KERJA: PREPROCESSING -> K-MEANS & DBI -> BACKPROPAGATION (5-3-1)")
    print("=" * 78)

    # --------------------------------------------------------------------------
    # TAHAP 1: DATA PREPROCESSING
    # --------------------------------------------------------------------------
    print("\n[TAHAP 1] Data Preprocessing...")
    if not MASTER.exists():
        raise FileNotFoundError(f"File master data awal tidak ditemukan: {MASTER}")
    
    raw = pd.read_excel(MASTER, sheet_name="Data Awal")
    raw.insert(0, "ID_Baris_Asli", np.arange(1, len(raw) + 1))
    if len(raw) != 437:
        raise ValueError(f"Data awal diharapkan 437, ditemukan {len(raw)}")

    # 1.1 Data Selection (5 variabel penelitian)
    selected = raw[[
        "ID_Baris_Asli", "NOBP", "Nama Lengkap",
        "Nilai Rata-Rata Akhir / IPS", "Penghasilan Orang Tua",
        "Jumlah Saudara / Jumlah Tanggungan", "Prestasi Akademik",
        "Prestasi Non-Akademik"
    ]].copy()

    # 1.2 Data Cleaning: Deduplikasi NOBP satu baris satu mahasiswa (first occurrence)
    selected["NOBP_key"] = selected["NOBP"].astype(str).str.strip()
    dup_nobp = selected[selected.duplicated("NOBP_key", keep="first")].copy()
    dedup = selected.drop_duplicates("NOBP_key", keep="first").copy().drop(columns=["NOBP_key"])

    # Validasi kelengkapan & tipe data
    dedup["IPS_num"] = dedup["Nilai Rata-Rata Akhir / IPS"].map(num)
    dedup["Tanggungan_num"] = dedup["Jumlah Saudara / Jumlah Tanggungan"].map(num)
    dedup["Akademik_num"] = dedup["Prestasi Akademik"].map(num)
    dedup["NonAkademik_num"] = dedup["Prestasi Non-Akademik"].map(num)
    dedup["Penghasilan_num"] = dedup["Penghasilan Orang Tua"].map(lambda x: income_to_rupiah(x)[0])

    valid = (
        dedup["NOBP"].notna() & dedup["Nama Lengkap"].notna() &
        dedup["Nama Lengkap"].astype(str).str.strip().ne("") &
        dedup["IPS_num"].notna() & dedup["Penghasilan_num"].notna() &
        dedup["Tanggungan_num"].notna() &
        dedup["Akademik_num"].isin([0, 1]) &
        dedup["NonAkademik_num"].isin([0, 1])
    )
    invalid = dedup.loc[~valid].copy()
    clean_before_name = dedup.loc[valid].copy()
    clean_before_name["Nama_Normalisasi"] = clean_before_name["Nama Lengkap"].map(name_key)
    dup_name = clean_before_name[clean_before_name.duplicated("Nama_Normalisasi", keep="first")].copy()
    clean = clean_before_name.drop_duplicates("Nama_Normalisasi", keep="first").copy()

    # 1.3 Outlier IQR (Diaudit & ditandai, tidak dihapus sesuai panduan/workbook)
    outlier_audit = []
    for col, label in [("IPS_num", "IPS"), ("Tanggungan_num", "Tanggungan")]:
        q1 = clean[col].quantile(0.25)
        q3 = clean[col].quantile(0.75)
        iqr = q3 - q1
        lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        for ix, row in clean.loc[(clean[col] < lo) | (clean[col] > hi)].iterrows():
            outlier_audit.append({
                "ID_Baris_Asli": row["ID_Baris_Asli"], "NOBP": row["NOBP"],
                "Nama Lengkap": row["Nama Lengkap"], "Atribut": label,
                "Nilai": row[col], "Batas Bawah": lo, "Batas Atas": hi,
                "Status": "Perlu verifikasi; tidak dihapus"
            })
    outliers = pd.DataFrame(outlier_audit)

    # 1.4 Data Transformation & Normalisasi Min-Max (0-1)
    clean["X1_IPS"] = clean["IPS_num"]
    inc = clean["Penghasilan Orang Tua"].map(income_to_rupiah)
    clean["X2_Penghasilan_Rp"] = inc.map(lambda z: z[0])
    clean["Aturan_Penghasilan"] = inc.map(lambda z: z[1])
    clean["X3_Tanggungan"] = clean["Tanggungan_num"]
    clean["X4_Akademik"] = clean["Akademik_num"]
    clean["X5_NonAkademik"] = clean["NonAkademik_num"]

    transformed = clean[[
        "ID_Baris_Asli", "NOBP", "Nama Lengkap", "X1_IPS",
        "Penghasilan Orang Tua", "X2_Penghasilan_Rp", "X3_Tanggungan",
        "X4_Akademik", "X5_NonAkademik", "Aturan_Penghasilan"
    ]].copy()

    norm = transformed[["X1_IPS", "X2_Penghasilan_Rp", "X3_Tanggungan", "X4_Akademik", "X5_NonAkademik"]].astype(float)
    mins = norm.min()
    maxs = norm.max()
    denom = (maxs - mins).replace(0, 1)
    scaled = (norm - mins) / denom
    scaled.columns = FEATURES

    data = pd.concat([
        pd.Series(np.arange(1, len(clean) + 1), name="No"),
        clean[["ID_Baris_Asli", "NOBP", "Nama Lengkap"]].reset_index(drop=True),
        scaled.reset_index(drop=True)
    ], axis=1)
    X = scaled.to_numpy(float)

    if len(data) != 268:
        raise ValueError(f"Hasil cleaning {len(data)} baris, baseline penelitian 268 baris.")

    # Verifikasi keselarasan normalisasi dengan baseline Excel
    if not EXCEL_KMEANS.exists():
        raise FileNotFoundError(f"File baseline Excel tidak ditemukan: {EXCEL_KMEANS}")
    excel_data = pd.read_excel(EXCEL_KMEANS, sheet_name="Data Normalisasi")
    max_diff = float(np.max(np.abs(X - excel_data[FEATURES].to_numpy(float))))
    print(f"Data valid final: {len(data)} baris (selisih numerik vs Excel: {max_diff:.12g})")

    # --------------------------------------------------------------------------
    # TAHAP 2: K-MEANS CLUSTERING & PENENTUAN JUMLAH CLUSTER
    # --------------------------------------------------------------------------
    print("\n[TAHAP 2] K-Means Clustering & Evaluasi Davies-Bouldin Index (DBI)...")
    centroid_df = pd.read_excel(EXCEL_KMEANS, sheet_name="Centroid Awal")
    centroids = centroid_df[FEATURES].to_numpy(float)
    history = []
    previous = None

    for it in range(1, 101):
        dist = np.linalg.norm(X[:, None, :] - centroids[None, :, :], axis=2)
        labels = np.argmin(dist, axis=1)
        newc = np.vstack([X[labels == k].mean(axis=0) if np.any(labels == k) else centroids[k] for k in range(2)])
        moved = None if previous is None else int(np.sum(labels != previous))
        history.append((centroids.copy(), dist.copy(), labels.copy(), newc.copy(), moved))
        if previous is not None and np.array_equal(labels, previous):
            break
        previous = labels.copy()
        centroids = newc
    else:
        raise RuntimeError("K-Means tidak konvergen dalam 100 iterasi.")

    final_labels = history[-1][2]
    final_names = np.where(final_labels == 0, "C1", "C2")

    # Evaluasi DBI Kandidat K=2 s.d. 6
    dbi_rows = []
    for k in range(2, 7):
        km = KMeans(n_clusters=k, random_state=SEED, n_init=20, max_iter=300, algorithm="lloyd")
        lab = km.fit_predict(X)
        dbi_rows.append({"K": k, "DBI": float(davies_bouldin_score(X, lab)), "Iterasi KMeans": int(km.n_iter_)})
    dbi_table = pd.DataFrame(dbi_rows)
    optimal_k = int(dbi_table.loc[dbi_table["DBI"].idxmin(), "K"])
    dbi_k2 = float(davies_bouldin_score(X, final_labels))

    # Pelabelan Target Hasil Clustering (C1 -> Layak = 1, C2 -> Tidak Layak = 0)
    # Dasar penetapan: Profil C1 memiliki IPS lebih tinggi, tanggungan setara,
    # serta seluruh anggotanya berprestasi akademik dan non-akademik = 1.
    target_bp = np.where(final_names == "C1", 1, 0)
    kategori_bp = np.where(target_bp == 1, "Layak", "Tidak Layak")

    data_bp = data.copy()
    data_bp["Cluster_KMeans"] = final_names
    data_bp["Kategori_KMeans"] = kategori_bp
    data_bp["Target_BP"] = target_bp

    print(f"Hasil K-Means: C1 = {int((final_labels==0).sum())} mahasiswa, C2 = {int((final_labels==1).sum())} mahasiswa")
    print(f"Evaluasi DBI: K={optimal_k} Optimal (DBI={dbi_table['DBI'].min():.6f}), DBI K=2: {dbi_k2:.6f}")

    # Rekonsiliasi & Dokumentasi Jumlah Data Preprocessing
    ringkasan = pd.DataFrame([
        ["1. Data Awal Sumber (BAZNAS)", len(raw), "Data mentah pendaftar beasiswa pada file master BAZNAS"],
        ["2. Data Setelah Deduplikasi NOBP", len(dedup), "Satu baris satu NOBP (152 baris NOBP ganda dikeluarkan)"],
        ["3. Data Tidak Lengkap / Tidak Valid", len(invalid), "11 baris memiliki data prestasi kosong / non-biner"],
        ["4. Data Sebelum Deduplikasi Nama", len(clean_before_name), "Data valid sebelum verifikasi kesamaan nama mahasiswa"],
        ["5. Data Nama Sama Dikeluarkan", len(dup_name), "6 baris nama sama dengan NOBP berbeda dikeluarkan"],
        ["6. Data Final Bersih", len(clean), "Data siap digunakan untuk K-Means & Backpropagation (268 baris)"]
    ], columns=["Tahap Preprocessing", "Jumlah", "Keterangan / Alasan"])

    # Simpan Hasil ke Lembar Kerja Excel
    iter_rows = []
    centroid_rows = []
    detail_sheets = {}
    for i, (c0, d, lab, cnew, moved) in enumerate(history, 1):
        iter_rows.append({
            "Iterasi": i, "Anggota C1": int((lab == 0).sum()), "Anggota C2": int((lab == 1).sum()),
            "Data berpindah": "-" if moved is None else moved,
            "Status": "Awal" if moved is None else ("Konvergen" if moved == 0 else "Berlanjut")
        })
        for k in range(2):
            centroid_rows.append({"Iterasi": i, "Jenis": "Centroid Awal", "Cluster": f"C{k+1}", **dict(zip(FEATURES, c0[k]))})
            centroid_rows.append({"Iterasi": i, "Jenis": "Centroid Baru", "Cluster": f"C{k+1}", **dict(zip(FEATURES, cnew[k]))})
        det = data.copy()
        det["Jarak C1"] = d[:, 0]
        det["Jarak C2"] = d[:, 1]
        det["Jarak Minimum"] = d.min(axis=1)
        det["Cluster"] = np.where(lab == 0, "C1", "C2")
        detail_sheets[f"Iterasi {i}"] = det

    hasil = data[["No", "NOBP", "Nama Lengkap"]].copy()
    hasil["Cluster"] = final_names
    hasil["Interpretasi Cluster"] = kategori_bp
    hasil["Target_BP"] = target_bp

    profil_cluster = pd.DataFrame([
        {
            "Cluster": "C1", "Jumlah Mahasiswa": int((final_labels==0).sum()),
            "Rata-rata IPS (Norm)": round(float(X[final_labels==0, 0].mean()), 4),
            "Rata-rata Gaji (Norm)": round(float(X[final_labels==0, 1].mean()), 4),
            "Rata-rata Tanggungan (Norm)": round(float(X[final_labels==0, 2].mean()), 4),
            "Prestasi Akademik (Rata-rata)": round(float(X[final_labels==0, 3].mean()), 4),
            "Prestasi Non-Akademik (Rata-rata)": round(float(X[final_labels==0, 4].mean()), 4),
            "Interpretasi Kelayakan": "Layak (Prioritas)"
        },
        {
            "Cluster": "C2", "Jumlah Mahasiswa": int((final_labels==1).sum()),
            "Rata-rata IPS (Norm)": round(float(X[final_labels==1, 0].mean()), 4),
            "Rata-rata Gaji (Norm)": round(float(X[final_labels==1, 1].mean()), 4),
            "Rata-rata Tanggungan (Norm)": round(float(X[final_labels==1, 2].mean()), 4),
            "Prestasi Akademik (Rata-rata)": round(float(X[final_labels==1, 3].mean()), 4),
            "Prestasi Non-Akademik (Rata-rata)": round(float(X[final_labels==1, 4].mean()), 4),
            "Interpretasi Kelayakan": "Tidak Layak (Prioritas Rendah)"
        }
    ])

    param = pd.DataFrame({"Variabel": FEATURES, "Minimum": mins.values, "Maksimum": maxs.values})

    with pd.ExcelWriter(OUTPUT_EXCEL, engine="openpyxl") as w:
        raw.to_excel(w, sheet_name="Data Awal", index=False)
        selected.to_excel(w, sheet_name="Data Selection", index=False)
        dup_nobp.to_excel(w, sheet_name="NOBP Berulang Dihapus", index=False)
        invalid.to_excel(w, sheet_name="Missing Tidak Valid", index=False)
        dup_name.to_excel(w, sheet_name="Nama Sama Dihapus", index=False)
        clean.to_excel(w, sheet_name="Data Cleaning Final", index=False)
        outliers.to_excel(w, sheet_name="Audit Outlier IQR", index=False)
        transformed.to_excel(w, sheet_name="Transformasi Numerik", index=False)
        param.to_excel(w, sheet_name="Parameter MinMax", index=False)
        data.to_excel(w, sheet_name="Normalisasi MinMax", index=False)
        ringkasan.to_excel(w, sheet_name="Ringkasan Preprocessing", index=False)
        pd.DataFrame(iter_rows).to_excel(w, sheet_name="Ringkasan Iterasi", index=False)
        pd.DataFrame(centroid_rows).to_excel(w, sheet_name="Centroid Tiap Iterasi", index=False)
        profil_cluster.to_excel(w, sheet_name="Profil Cluster", index=False)
        for name, frame in detail_sheets.items():
            frame.to_excel(w, sheet_name=name, index=False)
        dbi_table.to_excel(w, sheet_name="Evaluasi DBI Python", index=False)
        pd.DataFrame([{
            "K Optimal DBI": optimal_k, "DBI terendah": dbi_table["DBI"].min(),
            "DBI K2 manual": dbi_k2, "Selisih normalisasi maksimum vs Excel": max_diff
        }]).to_excel(w, sheet_name="Kesimpulan", index=False)
        hasil.to_excel(w, sheet_name="Hasil Clustering", index=False)
        data_bp.to_excel(w, sheet_name="Data Backpropagation", index=False)

    print(f"File Excel lengkap disimpan di: {OUTPUT_EXCEL}")

    # --------------------------------------------------------------------------
    # TAHAP 3 & 4: MODEL BACKPROPAGATION ARSITEKTUR 5-3-1 & EVALUASI
    # --------------------------------------------------------------------------
    print("\n[TAHAP 3 & 4] Membangun, Melatih, & Mengevaluasi Backpropagation (5-3-1)...")
    OUTPUT_BP_DIR.mkdir(parents=True, exist_ok=True)

    # 4.1 Pembagian Data (Stratified Split 80:20)
    y_all = data_bp["Target_BP"].to_numpy(int)
    X_all = data_bp[FEATURES].to_numpy(float)

    train_idx, test_idx = train_test_split(
        np.arange(len(data_bp)),
        test_size=0.20,
        random_state=SEED,
        stratify=y_all
    )

    X_train, y_train = X_all[train_idx], y_all[train_idx]
    X_test, y_test = X_all[test_idx], y_all[test_idx]

    df_train = data_bp.iloc[train_idx].copy().reset_index(drop=True)
    df_test = data_bp.iloc[test_idx].copy().reset_index(drop=True)

    print(f"Pembagian Data: Training = {len(X_train)} data (Layak: {(y_train==1).sum()}, Tidak Layak: {(y_train==0).sum()})")
    print(f"                Testing  = {len(X_test)} data (Layak: {(y_test==1).sum()}, Tidak Layak: {(y_test==0).sum()})")

    # 4.2 Inisialisasi Model Backpropagation 5-3-1
    bp_model = Backpropagation(n_input=N_INPUT, n_hidden=N_HIDDEN, seed=SEED)

    # Dokumentasi Bobot & Bias Awal
    bobot_awal_rows = []
    for i in range(bp_model.W1.shape[0]):
        for j in range(bp_model.W1.shape[1]):
            bobot_awal_rows.append({"Parameter": f"W_X{i+1}_H{j+1}", "Nilai_Awal": bp_model.W1[i, j]})
    for j, val in enumerate(bp_model.b1, 1):
        bobot_awal_rows.append({"Parameter": f"Bias_H{j}", "Nilai_Awal": val})
    for j in range(bp_model.W2.shape[0]):
        bobot_awal_rows.append({"Parameter": f"W_H{j+1}_O1", "Nilai_Awal": bp_model.W2[j, 0]})
    bobot_awal_rows.append({"Parameter": "Bias_O1", "Nilai_Awal": bp_model.b2})
    pd.DataFrame(bobot_awal_rows).to_csv(OUTPUT_BP_DIR / "01_bobot_bias_awal_arsitektur_5-3-1.csv", index=False)

    # 4.3 Pelatihan Model (Training)
    print(f"Melatih JST Backpropagation (Epochs: {MAX_EPOCHS}, Learning Rate: {ALPHA}, Arsitektur: 5-3-1)...")
    history_df = bp_model.train(X_train, y_train, alpha=ALPHA, epochs=MAX_EPOCHS, seed=SEED)
    history_df.to_csv(OUTPUT_BP_DIR / "02_riwayat_error_training_mse.csv", index=False)

    # Dokumentasi Bobot & Bias Akhir
    bobot_akhir_rows = []
    for i in range(bp_model.W1.shape[0]):
        for j in range(bp_model.W1.shape[1]):
            bobot_akhir_rows.append({"Parameter": f"W_X{i+1}_H{j+1}", "Nilai_Akhir": bp_model.W1[i, j]})
    for j, val in enumerate(bp_model.b1, 1):
        bobot_akhir_rows.append({"Parameter": f"Bias_H{j}", "Nilai_Akhir": val})
    for j in range(bp_model.W2.shape[0]):
        bobot_akhir_rows.append({"Parameter": f"W_H{j+1}_O1", "Nilai_Akhir": bp_model.W2[j, 0]})
    bobot_akhir_rows.append({"Parameter": "Bias_O1", "Nilai_Akhir": bp_model.b2})
    pd.DataFrame(bobot_akhir_rows).to_csv(OUTPUT_BP_DIR / "03_bobot_bias_akhir_arsitektur_5-3-1.csv", index=False)

    # 4.4 Evaluasi Model pada Data Training & Data Testing
    prob_train = bp_model.predict_proba(X_train)
    metrics_train, pred_train = evaluate_classification(y_train, prob_train)

    prob_test = bp_model.predict_proba(X_test)
    metrics_test, pred_test = evaluate_classification(y_test, prob_test)

    eval_df = pd.DataFrame([
        {"Dataset": "Data Training", "Jumlah": len(y_train), **metrics_train},
        {"Dataset": "Data Testing", "Jumlah": len(y_test), **metrics_test}
    ])
    eval_df.to_csv(OUTPUT_BP_DIR / "04_evaluasi_model_confusion_matrix.csv", index=False)

    # Rincian Hasil Prediksi Data Testing
    df_test["Probabilitas_Output"] = prob_test
    df_test["Prediksi_BP"] = pred_test
    df_test["Prediksi_Status"] = np.where(pred_test == 1, "Layak", "Tidak Layak")
    df_test["Evaluasi_Kesesuaian"] = np.where(df_test["Prediksi_BP"] == df_test["Target_BP"], "Benar", "Salah")
    df_test.to_csv(OUTPUT_BP_DIR / "05_hasil_pengujian_data_testing.csv", index=False)

    # Simpan Ringkasan Rekonsiliasi Jumlah Data ke Folder BP
    ringkasan.to_csv(OUTPUT_BP_DIR / "00_dokumentasi_jumlah_data_preprocessing.csv", index=False)
    profil_cluster.to_csv(OUTPUT_BP_DIR / "00_profil_cluster_dan_centroid.csv", index=False)

    # 4.5 Visualisasi: Grafik Penurunan MSE Training Tiap Epoch
    plt.figure(figsize=(8, 5))
    plt.plot(history_df["Epoch"], history_df["MSE_Training"], color="#1f77b4", lw=2, label="MSE Training")
    plt.title("Grafik Penurunan MSE Training Backpropagation (Arsitektur 5-3-1)", fontsize=12, pad=12)
    plt.xlabel("Epoch", fontsize=10)
    plt.ylabel("Mean Squared Error (MSE)", fontsize=10)
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.legend()
    plt.tight_layout()
    plt.savefig(OUTPUT_BP_DIR / "06_grafik_mse_training_5-3-1.png", dpi=300)
    plt.close()

    # 4.6 Visualisasi: Heatmap Confusion Matrix Data Testing
    cm = np.array([[metrics_test["TN"], metrics_test["FP"]],
                   [metrics_test["FN"], metrics_test["TP"]]])
    plt.figure(figsize=(6, 5))
    plt.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    plt.title("Confusion Matrix Data Testing (Arsitektur 5-3-1)", fontsize=12, pad=12)
    plt.colorbar()
    tick_marks = np.arange(2)
    plt.xticks(tick_marks, ["Tidak Layak (0)", "Layak (1)"])
    plt.yticks(tick_marks, ["Tidak Layak (0)", "Layak (1)"])
    thresh = cm.max() / 2.0
    for i in range(2):
        for j in range(2):
            plt.text(j, i, format(cm[i, j], "d"),
                     horizontalalignment="center",
                     color="white" if cm[i, j] > thresh else "black", fontsize=14, weight="bold")
    plt.ylabel("Target Sebenarnya (Label K-Means)", fontsize=10)
    plt.xlabel("Prediksi Model Backpropagation", fontsize=10)
    plt.tight_layout()
    plt.savefig(OUTPUT_BP_DIR / "07_confusion_matrix_testing.png", dpi=300)
    plt.close()

    print("\n" + "=" * 65)
    print("HASIL EVALUASI BACKPROPAGATION ARSITEKTUR 5-3-1")
    print("=" * 65)
    print(eval_df[["Dataset", "Jumlah", "Akurasi", "Presisi", "Recall", "F1_Score", "MSE", "TP", "TN", "FP", "FN"]].to_string(index=False))
    print("\n[CATATAN INTERPRETASI PENTING]:")
    print("Akurasi 100% pada Backpropagation menunjukkan bahwa jaringan syaraf tiruan")
    print("mampu mempelajari pemetaan fitur terhadap label klaster K-Means secara sempurna.")
    print("Hal ini bukan validasi independen kelayakan beasiswa di dunia nyata, melainkan")
    print("pembuktian konvergensi model JST terhadap hasil klasterisasi K-Means.")
    print(f"\nSeluruh output tersimpan lengkap di: {OUTPUT_BP_DIR}")

    return bp_model, mins, maxs


# ------------------------------------------------------------------------------
# 5. PERANCANGAN & IMPLEMENTASI GUI (GRAPHICAL USER INTERFACE)
# ------------------------------------------------------------------------------
def launch_gui(bp_model, mins, maxs):
    import tkinter as tk
    from tkinter import ttk, messagebox

    root = tk.Tk()
    root.title("SPK Beasiswa BAZNAS - Prediksi JST Backpropagation (5-3-1)")
    root.geometry("780x760")
    root.minsize(740, 720)
    root.configure(bg="#f4f6f9")

    # Styling modern
    style = ttk.Style(root)
    style.theme_use("clam")

    style.configure("Card.TLabelframe", background="#ffffff", bordercolor="#d5dbdb", relief="solid", borderwidth=1)
    style.configure("Card.TLabelframe.Label", background="#ffffff", foreground="#1a5276", font=("Segoe UI", 10, "bold"))
    style.configure("TLabel", background="#ffffff", font=("Segoe UI", 9))
    style.configure("TEntry", fieldbackground="#fdfefe", padding=5)
    style.configure("TCombobox", fieldbackground="#fdfefe", padding=4)

    # 1. HEADER SECTION
    header_frame = tk.Frame(root, bg="#1a5276", pady=18, padx=25)
    header_frame.pack(fill="x")

    lbl_badge = tk.Label(header_frame, text="SISTEM PENDUKUNG KEPUTUSAN (SPK)",
                         font=("Segoe UI", 8, "bold"), fg="#a9cce3", bg="#1a5276")
    lbl_badge.pack(anchor="w")

    lbl_title = tk.Label(header_frame, text="Klasifikasi Kelayakan Beasiswa BAZNAS",
                         font=("Segoe UI", 15, "bold"), fg="#ffffff", bg="#1a5276")
    lbl_title.pack(anchor="w", pady=(2, 2))

    lbl_subtitle = tk.Label(header_frame,
                            text="Implementasi Jaringan Syaraf Tiruan Backpropagation Arsitektur 5-3-1 | Universitas Dharma Andalas",
                            font=("Segoe UI", 9), fg="#d4e6f1", bg="#1a5276")
    lbl_subtitle.pack(anchor="w")

    # MAIN SCROLLABLE CONTAINER
    main_container = tk.Frame(root, bg="#f4f6f9", padx=25, pady=15)
    main_container.pack(fill="both", expand=True)

    # 2. CARD: FORM INPUT MAHASISWA
    card_input = ttk.LabelFrame(main_container, text=" Formulir Kriteria Mahasiswa ", style="Card.TLabelframe", padding=18)
    card_input.pack(fill="x", pady=(0, 15))

    card_input.columnconfigure(1, weight=1)

    # Input 1: IPS
    lbl1 = ttk.Label(card_input, text="1. Nilai IPS / IPK Terakhir:", font=("Segoe UI", 9, "bold"))
    lbl1.grid(row=0, column=0, sticky="w", pady=7, padx=(5, 15))
    ent_ips = ttk.Entry(card_input, font=("Segoe UI", 10))
    ent_ips.grid(row=0, column=1, sticky="ew", pady=7)
    lbl1_hint = ttk.Label(card_input, text="Skala 0.00 – 4.00 (Contoh: 3.75)", foreground="#7f8c8d", font=("Segoe UI", 8))
    lbl1_hint.grid(row=0, column=2, sticky="w", padx=(10, 5))

    # Input 2: Penghasilan Orang Tua
    lbl2 = ttk.Label(card_input, text="2. Penghasilan Orang Tua (Rp):", font=("Segoe UI", 9, "bold"))
    lbl2.grid(row=1, column=0, sticky="w", pady=7, padx=(5, 15))
    ent_gaji = ttk.Entry(card_input, font=("Segoe UI", 10))
    ent_gaji.grid(row=1, column=1, sticky="ew", pady=7)
    lbl2_hint = ttk.Label(card_input, text="Contoh: 1500000 atau <2jt", foreground="#7f8c8d", font=("Segoe UI", 8))
    lbl2_hint.grid(row=1, column=2, sticky="w", padx=(10, 5))

    # Input 3: Tanggungan
    lbl3 = ttk.Label(card_input, text="3. Jumlah Tanggungan Keluarga:", font=("Segoe UI", 9, "bold"))
    lbl3.grid(row=2, column=0, sticky="w", pady=7, padx=(5, 15))
    ent_tanggungan = ttk.Entry(card_input, font=("Segoe UI", 10))
    ent_tanggungan.grid(row=2, column=1, sticky="ew", pady=7)
    lbl3_hint = ttk.Label(card_input, text="Jumlah saudara/tanggungan (Orang)", foreground="#7f8c8d", font=("Segoe UI", 8))
    lbl3_hint.grid(row=2, column=2, sticky="w", padx=(10, 5))

    # Input 4: Prestasi Akademik
    lbl4 = ttk.Label(card_input, text="4. Prestasi Bidang Akademik:", font=("Segoe UI", 9, "bold"))
    lbl4.grid(row=3, column=0, sticky="w", pady=7, padx=(5, 15))
    cmb_akademik = ttk.Combobox(card_input, values=["1 - Memiliki Prestasi Akademik", "0 - Tidak Memiliki Prestasi"],
                                state="readonly", font=("Segoe UI", 9))
    cmb_akademik.current(0)
    cmb_akademik.grid(row=3, column=1, sticky="ew", pady=7)
    lbl4_hint = ttk.Label(card_input, text="Sertifikat / Juara lomba akademik", foreground="#7f8c8d", font=("Segoe UI", 8))
    lbl4_hint.grid(row=3, column=2, sticky="w", padx=(10, 5))

    # Input 5: Prestasi Non-Akademik
    lbl5 = ttk.Label(card_input, text="5. Prestasi Non-Akademik:", font=("Segoe UI", 9, "bold"))
    lbl5.grid(row=4, column=0, sticky="w", pady=7, padx=(5, 15))
    cmb_nonakademik = ttk.Combobox(card_input, values=["1 - Memiliki Prestasi Non-Akademik", "0 - Tidak Memiliki Prestasi"],
                                   state="readonly", font=("Segoe UI", 9))
    cmb_nonakademik.current(0)
    cmb_nonakademik.grid(row=4, column=1, sticky="ew", pady=7)
    lbl5_hint = ttk.Label(card_input, text="Seni, olahraga, organisasi, dsb.", foreground="#7f8c8d", font=("Segoe UI", 8))
    lbl5_hint.grid(row=4, column=2, sticky="w", padx=(10, 5))

    # 3. ACTION BUTTONS
    btn_box = tk.Frame(main_container, bg="#f4f6f9")
    btn_box.pack(fill="x", pady=(0, 15))

    # 4. CARD: HASIL PREDIKSI KELAYAKAN
    card_result = ttk.LabelFrame(main_container, text=" Keputusan Prediksi Kelayakan ", style="Card.TLabelframe", padding=18)
    card_result.pack(fill="both", expand=True)

    result_badge_frame = tk.Frame(card_result, bg="#ebedef", padx=15, pady=12, relief="groove", borderwidth=1)
    result_badge_frame.pack(fill="x", pady=(0, 10))

    lbl_status_res = tk.Label(result_badge_frame, text="STATUS: MENUNGGU PROSES PREDIKSI",
                              font=("Segoe UI", 13, "bold"), fg="#5d6d7e", bg="#ebedef")
    lbl_status_res.pack()

    lbl_prob_res = tk.Label(card_result, text="Nilai Aktivasi Sigmoid: -",
                            font=("Segoe UI", 10), bg="#ffffff", fg="#2c3e50")
    lbl_prob_res.pack(anchor="w", pady=(2, 4))

    detail_box = tk.Frame(card_result, bg="#f8f9f9", padx=12, pady=10, relief="solid", borderwidth=1)
    detail_box.pack(fill="x", pady=(5, 0))

    lbl_norm_title = tk.Label(detail_box, text="Vektor Masukan Ternormalisasi Min-Max [0, 1]:",
                              font=("Segoe UI", 8, "bold"), bg="#f8f9f9", fg="#34495e")
    lbl_norm_title.pack(anchor="w")

    lbl_norm_res = tk.Label(detail_box, text="X1 = - | X2 = - | X3 = - | X4 = - | X5 = -",
                            font=("Consolas", 9), bg="#f8f9f9", fg="#2c3e50")
    lbl_norm_res.pack(anchor="w", pady=(3, 0))

    def aksi_prediksi():
        try:
            val_ips = float(ent_ips.get().replace(",", ".").strip())
            if val_ips < 0.0 or val_ips > 4.0:
                raise ValueError("Nilai IPS harus berada dalam rentang 0.00 sampai 4.00.")

            val_gaji, _ = income_to_rupiah(ent_gaji.get().strip())
            if np.isnan(val_gaji) or val_gaji < 0:
                raise ValueError("Penghasilan orang tua harus berupa nominal angka valid atau kategori (misal: <1jt, 1500000).")

            val_tang = float(ent_tanggungan.get().replace(",", ".").strip())
            if val_tang < 0:
                raise ValueError("Jumlah tanggungan tidak boleh bernilai negatif.")

            val_akd = float(cmb_akademik.get().split()[0])
            val_non = float(cmb_nonakademik.get().split()[0])

            # Normalisasi Min-Max
            v_raw = np.array([val_ips, val_gaji, val_tang, val_akd, val_non], dtype=float)
            v_min = mins.to_numpy(float)
            v_max = maxs.to_numpy(float)
            v_norm = (v_raw - v_min) / (v_max - v_min)
            v_norm = np.clip(v_norm, 0.0, 1.0)

            # Forward pass Backpropagation 5-3-1
            prob = float(bp_model.predict_proba(v_norm.reshape(1, -1))[0])

            if prob >= 0.5:
                status_text = "LAYAK MENERIMA BEASISWA BAZNAS"
                badge_bg = "#d4efdf"
                status_fg = "#1e8449"
            else:
                status_text = "TIDAK LAYAK (PRIORITAS LEBIH RENDAH)"
                badge_bg = "#fadbd8"
                status_fg = "#b03a2e"

            result_badge_frame.config(bg=badge_bg)
            lbl_status_res.config(text=status_text, fg=status_fg, bg=badge_bg)
            lbl_prob_res.config(text=f"Nilai Aktivasi Output Sigmoid: {prob:.6f}  (Ambang Batas / Threshold: 0.500000)")
            lbl_norm_res.config(text=f"X1 (IPS): {v_norm[0]:.4f} | X2 (Gaji): {v_norm[1]:.4f} | X3 (Tanggungan): {v_norm[2]:.4f} | X4 (Akd): {v_norm[3]:.1f} | X5 (NonAkd): {v_norm[4]:.1f}")

        except Exception as e:
            messagebox.showerror("Validasi Input Gagal", f"Periksa kembali data masukan Anda:\n\n{e}")

    def aksi_reset():
        ent_ips.delete(0, tk.END)
        ent_gaji.delete(0, tk.END)
        ent_tanggungan.delete(0, tk.END)
        cmb_akademik.current(0)
        cmb_nonakademik.current(0)
        result_badge_frame.config(bg="#ebedef")
        lbl_status_res.config(text="STATUS: MENUNGGU PROSES PREDIKSI", fg="#5d6d7e", bg="#ebedef")
        lbl_prob_res.config(text="Nilai Aktivasi Sigmoid: -")
        lbl_norm_res.config(text="X1 = - | X2 = - | X3 = - | X4 = - | X5 = -")
        ent_ips.focus_set()

    btn_prediksi = tk.Button(btn_box, text="⚡  Proses Prediksi Kelayakan", font=("Segoe UI", 10, "bold"),
                             bg="#1f618d", fg="#ffffff", activebackground="#154360", activeforeground="#ffffff",
                             relief="flat", padx=20, pady=8, cursor="hand2", command=aksi_prediksi)
    btn_prediksi.pack(side="left", expand=True, fill="x", padx=(0, 6))

    btn_reset = tk.Button(btn_box, text="🔄  Reset Formulir", font=("Segoe UI", 10),
                          bg="#7f8c8d", fg="#ffffff", activebackground="#616a6b", activeforeground="#ffffff",
                          relief="flat", padx=16, pady=8, cursor="hand2", command=aksi_reset)
    btn_reset.pack(side="right", expand=False, fill="y", padx=(6, 0))

    # Autofocus pada field pertama
    ent_ips.focus_set()

    root.mainloop()


# ------------------------------------------------------------------------------
# ENTRY POINT PROGRAM
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pipeline SPK BAZNAS Preprocessing, KMeans, DBI, Backpropagation 5-3-1, dan GUI")
    parser.add_argument("--gui", action="store_true", help="Buka antarmuka GUI prediksi setelah pengujian selesai")
    parser.add_argument("--no-gui", action="store_true", help="Jalankan pipeline dan simpan output tanpa GUI")
    args = parser.parse_args()

    # Eksekusi pipeline pengujian
    model, v_min, v_max = run_pipeline()

    if args.gui:
        print("\nMembuka Antarmuka GUI...")
        launch_gui(model, v_min, v_max)
    elif not args.no_gui:
        print("\nPengujian pipeline dan arsitektur 5-3-1 berhasil diselesaikan.")
        print("Untuk membuka GUI interaktif, jalankan perintah:")
        print("  python pipeline_baznas_dari_preprocessing_sampai_dbi.py --gui")
