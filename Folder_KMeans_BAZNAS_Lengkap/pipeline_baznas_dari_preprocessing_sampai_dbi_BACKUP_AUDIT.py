# ==============================================================================
# PIPELINE PENELITIAN SPK BEASISWA BAZNAS (UNIVERSITAS DHARMA ANDALAS)
# Sesuai Alur Kerangka Penelitian (Gambar 3.1):
# 1. DATA PREPROCESSING (Selection, Cleaning, Transformation, Min-Max 0-1)
# 2. K-MEANS CLUSTERING & EVALUASI DBI (Penentuan K Optimal & Pelabelan Target)
# 3. PEMBENTUKAN MODEL ARSITEKTUR BACKPROPAGATION (Arsitektur 5-3-1)
# 4. IMPLEMENTASI DAN EVALUASI MODEL (Split Data, Pelatihan, Pengujian, Confusion Matrix)
# 5. PERANCANGAN & IMPLEMENTASI GUI (Tkinter untuk Prediksi Kelayakan Beasiswa)
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
# KONFIGURASI FILE & PARAMETER
# ------------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
MASTER = BASE_DIR / "BAZNAS_Data_Awal_Selection_Cleaning_Transformation.xlsx"
EXCEL_KMEANS = BASE_DIR / "FIX DATA BAZNAS K MEANS.xlsx"
OUTPUT_EXCEL = BASE_DIR / "Hasil_Pipeline_Lengkap_Preprocessing_KMeans_DBI.xlsx"
OUTPUT_BP_DIR = BASE_DIR / "hasil_backpropagation_5-3-1"

FEATURES = ["X1_IPS", "X2_Penghasilan", "X3_Tanggungan", "X4_Akademik", "X5_NonAkademik"]

# Parameter Backpropagation 5-3-1
N_INPUT = 5
N_HIDDEN = 3  # Arsitektur Hidden Layer: 5-3-1
N_OUTPUT = 1
ALPHA = 0.5
MAX_EPOCHS = 1000
SEED = 42

# ------------------------------------------------------------------------------
# FUNGSI BANTU PREPROCESSING
# ------------------------------------------------------------------------------
def name_key(x):
    return re.sub(r"\s+", " ", str(x).strip().casefold())

def num(x):
    if pd.isna(x): return np.nan
    try: return float(str(x).replace(",", ".").replace(" ", "").strip())
    except: return np.nan

def income_to_rupiah(x):
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
    z = np.clip(z, -40.0, 40.0)
    return 1.0 / (1.0 + np.exp(-z))

# ------------------------------------------------------------------------------
# KELAS BACKPROPAGATION (5-3-1)
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
                # Forward Pass
                out_hidden = np.zeros(n_hidden, dtype=np.float64)
                for j in range(n_hidden):
                    val = b1[j]
                    for i in range(n_input):
                        val += X[idx, i] * W1[i, j]
                    # Sigmoid
                    if val >= 0:
                        out_hidden[j] = 1.0 / (1.0 + np.exp(-val))
                    else:
                        ev = np.exp(val)
                        out_hidden[j] = ev / (1.0 + ev)

                net_o = b2
                for j in range(n_hidden):
                    net_o += out_hidden[j] * W2[j, 0]
                if net_o >= 0:
                    out_o = 1.0 / (1.0 + np.exp(-net_o))
                else:
                    ev = np.exp(net_o)
                    out_o = ev / (1.0 + ev)

                # Error output
                target = y[idx]
                delta_o = (target - out_o) * out_o * (1.0 - out_o)

                # Error hidden
                delta_h = np.zeros(n_hidden, dtype=np.float64)
                for j in range(n_hidden):
                    delta_h[j] = delta_o * W2[j, 0] * out_hidden[j] * (1.0 - out_hidden[j])

                # Update output layer
                for j in range(n_hidden):
                    W2[j, 0] += alpha * delta_o * out_hidden[j]
                b2 += alpha * delta_o

                # Update hidden layer
                for i in range(n_input):
                    for j in range(n_hidden):
                        W1[i, j] += alpha * delta_h[j] * X[idx, i]
                for j in range(n_hidden):
                    b1[j] += alpha * delta_h[j]

            # Hitung MSE Epoch pada seluruh X
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
    def __init__(self, n_input=5, n_hidden=3, seed=SEED):
        self.n_input = n_input
        self.n_hidden = n_hidden
        self.seed = seed
        rng = np.random.default_rng(seed)
        # Inisialisasi bobot dan bias acak kecil [-0.5, 0.5]
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
# EKSEKUSI PIPELINE LENGKAP (LANGKAH 1 s.d. 4)
# ------------------------------------------------------------------------------
def run_pipeline():
    print("=" * 70)
    print("PENELITIAN SPK PENERIMA BEASISWA BAZNAS - UNIVERSITAS DHARMA ANDALAS")
    print("KERANGKA KERJA: PREPROCESSING -> K-MEANS & DBI -> BACKPROPAGATION (5-3-1)")
    print("=" * 70)

    # --------------------------------------------------------------------------
    # TAHAP 1: DATA PREPROCESSING
    # --------------------------------------------------------------------------
    print("\n[TAHAP 1] Menjalankan Data Preprocessing...")
    if not MASTER.exists():
        raise FileNotFoundError(f"File master data awal tidak ditemukan: {MASTER}")
    
    raw = pd.read_excel(MASTER, sheet_name="Data Awal")
    raw.insert(0, "ID_Baris_Asli", np.arange(1, len(raw) + 1))
    if len(raw) != 437:
        raise ValueError(f"Data awal diharapkan 437, ditemukan {len(raw)}")

    # 1.1 Data Selection (5 variabel)
    selected = raw[[
        "ID_Baris_Asli", "NOBP", "Nama Lengkap",
        "Nilai Rata-Rata Akhir / IPS", "Penghasilan Orang Tua",
        "Jumlah Saudara / Jumlah Tanggungan", "Prestasi Akademik",
        "Prestasi Non-Akademik"
    ]].copy()

    # 1.2 Data Cleaning
    selected["NOBP_key"] = selected["NOBP"].astype(str).str.strip()
    dup_nobp = selected[selected.duplicated("NOBP_key", keep="first")].copy()
    dedup = selected.drop_duplicates("NOBP_key", keep="first").copy().drop(columns=["NOBP_key"])

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

    # 1.3 Outlier IQR (Diaudit & ditandai, tidak dihapus sesuai workbook)
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

    # 1.4 Data Transformation & Min-Max Normalization (0-1)
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

    # Verifikasi konsistensi numerik dengan Excel
    if not EXCEL_KMEANS.exists():
        raise FileNotFoundError(f"File baseline Excel tidak ditemukan: {EXCEL_KMEANS}")
    excel_data = pd.read_excel(EXCEL_KMEANS, sheet_name="Data Normalisasi")
    max_diff = float(np.max(np.abs(X - excel_data[FEATURES].to_numpy(float))))
    print(f"Data valid preprocessing: {len(data)} baris. Selisih maksimum vs Excel: {max_diff:.12g}")

    # --------------------------------------------------------------------------
    # TAHAP 2: K-MEANS CLUSTERING & EVALUASI DBI
    # --------------------------------------------------------------------------
    print("\n[TAHAP 2] Menjalankan K-Means Clustering & Evaluasi Davies-Bouldin Index (DBI)...")
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

    # Evaluasi DBI K=2 s.d. 6
    dbi_rows = []
    for k in range(2, 7):
        km = KMeans(n_clusters=k, random_state=SEED, n_init=20, max_iter=300, algorithm="lloyd")
        lab = km.fit_predict(X)
        dbi_rows.append({"K": k, "DBI": float(davies_bouldin_score(X, lab)), "Iterasi KMeans": int(km.n_iter_)})
    dbi_table = pd.DataFrame(dbi_rows)
    optimal_k = int(dbi_table.loc[dbi_table["DBI"].idxmin(), "K"])
    dbi_k2 = float(davies_bouldin_score(X, final_labels))

    # Pelabelan Target Hasil Clustering (C1 -> Layak = 1, C2 -> Tidak Layak = 0)
    # Sesuai sheet Profil Cluster: C1 (Prestasi tinggi, IPS tinggi, Penghasilan rendah)
    target_bp = np.where(final_names == "C1", 1, 0)
    kategori_bp = np.where(target_bp == 1, "Layak", "Tidak Layak")

    data_bp = data.copy()
    data_bp["Cluster_KMeans"] = final_names
    data_bp["Kategori_KMeans"] = kategori_bp
    data_bp["Target_BP"] = target_bp

    print(f"Hasil Clustering K-Means: C1={int((final_labels==0).sum())}, C2={int((final_labels==1).sum())}")
    print(f"K Optimal DBI: K={optimal_k} (DBI={dbi_table['DBI'].min():.6f}), DBI K=2: {dbi_k2:.6f}")

    # Simpan Excel Hasil Preprocessing & K-Means
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

    ringkasan = pd.DataFrame([
        ["Data Awal", len(raw)],
        ["Data setelah deduplikasi NOBP", len(dedup)],
        ["Data tidak valid dikeluarkan", len(invalid)],
        ["Data sebelum deduplikasi nama", len(clean_before_name)],
        ["Nama berulang dihapus", len(dup_name)],
        ["Data final", len(clean)]
    ], columns=["Tahap", "Jumlah"])

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
    # TAHAP 3 & 4: MODEL BACKPROPAGATION ARSITEKTUR 5-3-1 & EVALUASI MODEL
    # --------------------------------------------------------------------------
    print("\n[TAHAP 3 & 4] Membangun, Melatih, & Mengevaluasi Model Backpropagation 5-3-1...")
    OUTPUT_BP_DIR.mkdir(parents=True, exist_ok=True)

    # Pembagian Data: Stratified Split 80% Training (214 data), 20% Testing (54 data)
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

    # Inisialisasi Model Backpropagation 5-3-1
    bp_model = Backpropagation(n_input=5, n_hidden=3, seed=SEED)

    # Catat Bobot & Bias Awal
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

    # Pelatihan Model (Training)
    print(f"Melatih JST Backpropagation (Epochs: {MAX_EPOCHS}, Learning Rate: {ALPHA}, Hidden: 3)...")
    history_df = bp_model.train(X_train, y_train, alpha=ALPHA, epochs=MAX_EPOCHS, seed=SEED)
    history_df.to_csv(OUTPUT_BP_DIR / "02_riwayat_error_training_mse.csv", index=False)

    # Catat Bobot & Bias Akhir
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

    # Evaluasi pada Data Training
    prob_train = bp_model.predict_proba(X_train)
    metrics_train, pred_train = evaluate_classification(y_train, prob_train)

    # Evaluasi pada Data Testing (Pengujian Model)
    prob_test = bp_model.predict_proba(X_test)
    metrics_test, pred_test = evaluate_classification(y_test, prob_test)

    # Tabel Evaluasi Model (Confusion Matrix & Metrik)
    eval_df = pd.DataFrame([
        {"Dataset": "Data Training", "Jumlah": len(y_train), **metrics_train},
        {"Dataset": "Data Testing", "Jumlah": len(y_test), **metrics_test}
    ])
    eval_df.to_csv(OUTPUT_BP_DIR / "04_evaluasi_model_confusion_matrix.csv", index=False)

    # Simpan Rincian Hasil Prediksi Data Testing
    df_test["Probabilitas_Output"] = prob_test
    df_test["Prediksi_BP"] = pred_test
    df_test["Prediksi_Status"] = np.where(pred_test == 1, "Layak", "Tidak Layak")
    df_test["Evaluasi_Kesesuaian"] = np.where(df_test["Prediksi_BP"] == df_test["Target_BP"], "Benar", "Salah")
    df_test.to_csv(OUTPUT_BP_DIR / "05_hasil_pengujian_data_testing.csv", index=False)

    # Visualisasi 1: Grafik Riwayat MSE Training Tiap Epoch
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

    # Visualisasi 2: Confusion Matrix Testing Heatmap
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
    plt.ylabel("Target Sebenarnya (K-Means)", fontsize=10)
    plt.xlabel("Prediksi Model Backpropagation", fontsize=10)
    plt.tight_layout()
    plt.savefig(OUTPUT_BP_DIR / "07_confusion_matrix_testing.png", dpi=300)
    plt.close()

    print("\n" + "=" * 50)
    print("HASIL EVALUASI BACKPROPAGATION ARSITEKTUR 5-3-1")
    print("=" * 50)
    print(eval_df[["Dataset", "Jumlah", "Akurasi", "Presisi", "Recall", "F1_Score", "MSE", "TP", "TN", "FP", "FN"]].to_string(index=False))
    print(f"\nSemua file output Backpropagation disimpan di folder: {OUTPUT_BP_DIR}")

    return bp_model, mins, maxs


# ------------------------------------------------------------------------------
# TAHAP 5: PERANCANGAN & IMPLEMENTASI GUI (GRAPHICAL USER INTERFACE)
# ------------------------------------------------------------------------------
def launch_gui(bp_model, mins, maxs):
    import tkinter as tk
    from tkinter import ttk, messagebox

    root = tk.Tk()
    root.title("Sistem Pendukung Keputusan Penerima Beasiswa BAZNAS - BP 5-3-1")
    root.geometry("640x680")
    root.resizable(False, False)

    # Style
    style = ttk.Style(root)
    style.theme_use("clam")

    header_frame = tk.Frame(root, bg="#1a5276", pady=15)
    header_frame.pack(fill="x")

    lbl_title = tk.Label(header_frame, text="SISTEM PREDIKSI KELAYAKAN BEASISWA BAZNAS",
                         font=("Helvetica", 13, "bold"), fg="white", bg="#1a5276")
    lbl_title.pack()
    lbl_subtitle = tk.Label(header_frame, text="Implementasi Model Backpropagation Arsitektur 5-3-1\nUniversitas Dharma Andalas",
                            font=("Helvetica", 9), fg="#ebf5fb", bg="#1a5276")
    lbl_subtitle.pack(pady=4)

    content_frame = ttk.LabelFrame(root, text=" Form Input Kriteria Calon Penerima ", padding=15)
    content_frame.pack(fill="both", expand=True, padx=20, pady=15)

    # Form Fields
    # 1. IPS
    lbl_ips = ttk.Label(content_frame, text="1. Nilai Rata-Rata Akhir / IPS (Contoh: 3.75):", font=("Helvetica", 9, "bold"))
    lbl_ips.grid(row=0, column=0, sticky="w", pady=6)
    ent_ips = ttk.Entry(content_frame, font=("Helvetica", 10), width=28)
    ent_ips.grid(row=0, column=1, sticky="e", pady=6)

    # 2. Penghasilan Orang Tua
    lbl_gaji = ttk.Label(content_frame, text="2. Penghasilan Orang Tua (Rp):", font=("Helvetica", 9, "bold"))
    lbl_gaji.grid(row=1, column=0, sticky="w", pady=6)
    ent_gaji = ttk.Entry(content_frame, font=("Helvetica", 10), width=28)
    ent_gaji.grid(row=1, column=1, sticky="e", pady=6)

    # 3. Tanggungan
    lbl_tanggungan = ttk.Label(content_frame, text="3. Jumlah Tanggungan Keluarga (Orang):", font=("Helvetica", 9, "bold"))
    lbl_tanggungan.grid(row=2, column=0, sticky="w", pady=6)
    ent_tanggungan = ttk.Entry(content_frame, font=("Helvetica", 10), width=28)
    ent_tanggungan.grid(row=2, column=1, sticky="e", pady=6)

    # 4. Prestasi Akademik
    lbl_akademik = ttk.Label(content_frame, text="4. Memiliki Prestasi Akademik:", font=("Helvetica", 9, "bold"))
    lbl_akademik.grid(row=3, column=0, sticky="w", pady=6)
    cmb_akademik = ttk.Combobox(content_frame, values=["1 - Ya (Memiliki Prestasi)", "0 - Tidak Ada"],
                                state="readonly", font=("Helvetica", 9), width=26)
    cmb_akademik.current(0)
    cmb_akademik.grid(row=3, column=1, sticky="e", pady=6)

    # 5. Prestasi Non-Akademik
    lbl_nonakademik = ttk.Label(content_frame, text="5. Memiliki Prestasi Non-Akademik:", font=("Helvetica", 9, "bold"))
    lbl_nonakademik.grid(row=4, column=0, sticky="w", pady=6)
    cmb_nonakademik = ttk.Combobox(content_frame, values=["1 - Ya (Memiliki Prestasi)", "0 - Tidak Ada"],
                                   state="readonly", font=("Helvetica", 9), width=26)
    cmb_nonakademik.current(0)
    cmb_nonakademik.grid(row=4, column=1, sticky="e", pady=6)

    # Frame Hasil
    result_frame = ttk.LabelFrame(root, text=" Hasil Klasifikasi Kelayakan ", padding=12)
    result_frame.pack(fill="x", padx=20, pady=(0, 15))

    lbl_status_res = tk.Label(result_frame, text="Status: MENUNGGU INPUT", font=("Helvetica", 12, "bold"), fg="#7f8c8d")
    lbl_status_res.pack(pady=4)

    lbl_prob_res = tk.Label(result_frame, text="Nilai Output Aktivasi Sigmoid: -", font=("Helvetica", 9))
    lbl_prob_res.pack()

    lbl_norm_res = tk.Label(result_frame, text="", font=("Helvetica", 8), fg="#555555")
    lbl_norm_res.pack(pady=2)

    def prediksi():
        try:
            val_ips = float(ent_ips.get().replace(",", ".").strip())
            val_gaji, _ = income_to_rupiah(ent_gaji.get().strip())
            if np.isnan(val_gaji):
                raise ValueError("Penghasilan orang tua harus berupa nominal rupiah atau format kategori (misal: <1jt, 1500000).")
            val_tang = float(ent_tanggungan.get().replace(",", ".").strip())
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
            status = "LAYAK (DITERIMA)" if prob >= 0.5 else "TIDAK LAYAK"
            color = "#27ae60" if prob >= 0.5 else "#c0392b"

            lbl_status_res.config(text=f"Status: {status}", fg=color)
            lbl_prob_res.config(text=f"Nilai Output Aktivasi Sigmoid: {prob:.6f} (Threshold: 0.50)")
            lbl_norm_res.config(text=f"Normalisasi Min-Max: IPS={v_norm[0]:.3f}, Gaji={v_norm[1]:.3f}, Tanggungan={v_norm[2]:.3f}, Akd={v_norm[3]:.0f}, NonAkd={v_norm[4]:.0f}")

        except Exception as e:
            messagebox.showerror("Kesalahan Input", f"Terjadi kesalahan pada data input:\n{e}")

    def reset():
        ent_ips.delete(0, tk.END)
        ent_gaji.delete(0, tk.END)
        ent_tanggungan.delete(0, tk.END)
        cmb_akademik.current(0)
        cmb_nonakademik.current(0)
        lbl_status_res.config(text="Status: MENUNGGU INPUT", fg="#7f8c8d")
        lbl_prob_res.config(text="Nilai Output Aktivasi Sigmoid: -")
        lbl_norm_res.config(text="")

    btn_frame = tk.Frame(root)
    btn_frame.pack(fill="x", padx=20, pady=(0, 15))

    btn_prediksi = tk.Button(btn_frame, text="Proses Prediksi", font=("Helvetica", 10, "bold"),
                             bg="#2980b9", fg="white", padx=15, pady=6, command=prediksi)
    btn_prediksi.pack(side="left", expand=True, fill="x", padx=(0, 5))

    btn_reset = tk.Button(btn_frame, text="Reset Form", font=("Helvetica", 10),
                          bg="#95a5a6", fg="white", padx=15, pady=6, command=reset)
    btn_reset.pack(side="right", expand=True, fill="x", padx=(5, 0))

    root.mainloop()


# ------------------------------------------------------------------------------
# MAIN EXECUTION
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pipeline Lengkap BAZNAS Preprocessing, KMeans, DBI, Backpropagation 5-3-1, dan GUI")
    parser.add_argument("--gui", action="store_true", help="Buka antarmuka GUI prediksi setelah pelatihan selesai")
    parser.add_argument("--no-gui", action="store_true", help="Hanya jalankan proses pipeline dan simpan output tanpa membuka antarmuka GUI")
    args = parser.parse_args()

    # Jalankan pipeline tahap 1 s.d. 4
    model, v_min, v_max = run_pipeline()

    # Luncurkan GUI jika opsi --gui dipilih atau dijalankan langsung secara interaktif
    if args.gui:
        print("\nMembuka Antarmuka GUI...")
        launch_gui(model, v_min, v_max)
    elif not args.no_gui:
        # Default jika dijalankan interaktif: tanyakan atau siap dipanggil
        print("\nPipeline dan pengujian arsitektur 5-3-1 berhasil diselesaikan.")
        print("Untuk membuka GUI prediksi interaktif, jalankan perintah:")
        print("  python pipeline_baznas_dari_preprocessing_sampai_dbi.py --gui")
