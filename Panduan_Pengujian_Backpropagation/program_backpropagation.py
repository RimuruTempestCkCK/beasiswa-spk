#!/usr/bin/env python3
"""Backpropagation 5-H-1 for scholarship eligibility data.

Input workbook: Data_Backpropagation_435_Target_1_0.xlsx
Internal target: Layak=1, Tidak Layak=0 (binary sigmoid)
Training: online/one-pattern-at-a-time Backpropagation, alpha=0.5, 1000 epochs.
Split: group-stratified 80:20 by NOBP (348 train, 87 test for the current 435-row dataset).
"""
from pathlib import Path
import argparse
import json
import math
import zipfile
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.optimize import milp, LinearConstraint, Bounds

try:
    from numba import njit
    NUMBA_AVAILABLE = True
except ImportError:
    NUMBA_AVAILABLE = False
    njit = None


INPUT_DEFAULT = "/mnt/data/Data_Backpropagation_435_Target_1_0.xlsx"
SHEET_DEFAULT = "Data Backpropagation"
FEATURES = [
    "X1_IPS_IPK",
    "X2_Penghasilan_Rp",
    "X3_Tanggungan",
    "X4_Prestasi_Akademik",
    "X5_Prestasi_NonAkademik",
]
ALPHA = 0.5
MAX_EPOCHS = 1000
SEED = 42
HIDDEN_UNITS = list(range(3, 13))


def sigmoid(z):
    z = np.clip(z, -40.0, 40.0)
    return 1.0 / (1.0 + np.exp(-z))


def group_stratified_split(df, test_fraction=0.20, seed=SEED):
    """Group split by NOBP: all records from one student stay in one partition.

    An integer optimization selects the requested test counts per class and the
    approximate 20% share of unique NOBP groups. No record is dropped.
    """
    ids = df["NOBP"].astype("string").str.strip()
    if ids.isna().any() or (ids == "").any():
        raise ValueError("NOBP kosong ditemukan; perbaiki ID sebelum pembagian berbasis kelompok.")
    y = pd.to_numeric(df["Target_BP"], errors="raise").astype(int)
    groups = pd.DataFrame({"_id": ids, "_y": y}).groupby("_id", sort=True)["_y"].agg(
        n0=lambda values: int((values == 0).sum()),
        n1=lambda values: int((values == 1).sum()),
        n="size",
    )
    test_n0 = int(round(int((y == 0).sum()) * test_fraction))
    test_n1 = int(round(int((y == 1).sum()) * test_fraction))
    test_group_count = int(round(len(groups) * test_fraction))
    matrix = np.vstack([
        groups["n0"].to_numpy(dtype=float),
        groups["n1"].to_numpy(dtype=float),
        np.ones(len(groups), dtype=float),
    ])
    targets = np.array([test_n0, test_n1, test_group_count], dtype=float)
    rng = np.random.default_rng(seed)
    objective = rng.uniform(0.0, 1e-4, size=len(groups))
    solution = milp(
        c=objective,
        integrality=np.ones(len(groups), dtype=int),
        bounds=Bounds(np.zeros(len(groups)), np.ones(len(groups))),
        constraints=LinearConstraint(matrix, targets, targets),
        options={"time_limit": 30},
    )
    if not solution.success or solution.x is None:
        raise RuntimeError(f"Pembagian kelompok NOBP tidak memenuhi kuota: {solution.message}")
    selected_test_ids = set(groups.index[np.rint(solution.x).astype(int) == 1].astype(str))
    test_mask = ids.isin(selected_test_ids).to_numpy()
    test_idx = np.flatnonzero(test_mask)
    train_idx = np.flatnonzero(~test_mask)
    if set(ids.iloc[train_idx].astype(str)) & set(ids.iloc[test_idx].astype(str)):
        raise AssertionError("NOBP masih tumpang tindih antara training dan testing.")
    return train_idx, test_idx


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
            for q in range(n):
                idx = order[q]
                net_h = np.empty(n_hidden, dtype=np.float64)
                out_h = np.empty(n_hidden, dtype=np.float64)
                for j in range(n_hidden):
                    v = b1[j]
                    for i in range(n_input):
                        v += X[idx, i] * W1[i, j]
                    net_h[j] = v
                    if v >= 0:
                        out_h[j] = 1.0 / (1.0 + np.exp(-v))
                    else:
                        ev = np.exp(v)
                        out_h[j] = ev / (1.0 + ev)
                net_o = b2
                for j in range(n_hidden):
                    net_o += out_h[j] * W2[j, 0]
                if net_o >= 0:
                    out_o = 1.0 / (1.0 + np.exp(-net_o))
                else:
                    ev = np.exp(net_o)
                    out_o = ev / (1.0 + ev)
                delta_o = (y[idx] - out_o) * out_o * (1.0 - out_o)
                delta_h = np.empty(n_hidden, dtype=np.float64)
                for j in range(n_hidden):
                    delta_h[j] = delta_o * W2[j, 0] * out_h[j] * (1.0 - out_h[j])
                for j in range(n_hidden):
                    W2[j, 0] += alpha * delta_o * out_h[j]
                b2 += alpha * delta_o
                for i in range(n_input):
                    for j in range(n_hidden):
                        W1[i, j] += alpha * X[idx, i] * delta_h[j]
                for j in range(n_hidden):
                    b1[j] += alpha * delta_h[j]
            total_error = 0.0
            for idx in range(n):
                out_hidden = np.empty(n_hidden, dtype=np.float64)
                for j in range(n_hidden):
                    v = b1[j]
                    for i in range(n_input):
                        v += X[idx, i] * W1[i, j]
                    if v >= 0:
                        out_hidden[j] = 1.0 / (1.0 + np.exp(-v))
                    else:
                        ev = np.exp(v)
                        out_hidden[j] = ev / (1.0 + ev)
                net = b2
                for j in range(n_hidden):
                    net += out_hidden[j] * W2[j, 0]
                if net >= 0:
                    pred = 1.0 / (1.0 + np.exp(-net))
                else:
                    ev = np.exp(net)
                    pred = ev / (1.0 + ev)
                err = y[idx] - pred
                total_error += err * err
            history[epoch] = total_error / n
        return W1, b1, W2, b2, history


class Backpropagation:
    def __init__(self, n_input, n_hidden, seed):
        rng = np.random.default_rng(seed)
        # Small random initial values for weights and biases.
        self.W1 = rng.uniform(-0.5, 0.5, size=(n_input, n_hidden))
        self.b1 = rng.uniform(-0.5, 0.5, size=(n_hidden,))
        self.W2 = rng.uniform(-0.5, 0.5, size=(n_hidden, 1))
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
                X.astype(np.float64), y.astype(np.float64), self.W1, self.b1, self.W2, self.b2,
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


def classification_metrics(y_true, prob):
    y_pred = (prob >= 0.5).astype(int)
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))
    accuracy = float((tp + tn) / len(y_true)) if len(y_true) else 0.0
    precision = float(tp / (tp + fp)) if tp + fp else 0.0
    recall = float(tp / (tp + fn)) if tp + fn else 0.0
    specificity = float(tn / (tn + fp)) if tn + fp else 0.0
    f1 = float(2 * precision * recall / (precision + recall)) if precision + recall else 0.0
    mse = float(np.mean((y_true - prob) ** 2)) if len(y_true) else float("nan")
    return {
        "Akurasi": accuracy,
        "MSE": mse,
        "Presisi": precision,
        "Recall": recall,
        "Spesifisitas": specificity,
        "F1_Score": f1,
        "TN": tn, "FP": fp, "FN": fn, "TP": tp,
    }, y_pred


def build_trace(sample, target, seed, alpha, out_dir):
    """Capture initial parameters and one illustrative forward/backward update for 5-3-1."""
    model = Backpropagation(5, 3, seed)
    param_rows = []
    for i in range(model.W1.shape[0]):
        for j in range(model.W1.shape[1]):
            param_rows.append({"Parameter": f"W_X{i+1}_H{j+1}", "Nilai_Awal": model.W1[i, j]})
    for j, value in enumerate(model.b1, start=1):
        param_rows.append({"Parameter": f"Bias_H{j}", "Nilai_Awal": value})
    for j in range(model.W2.shape[0]):
        param_rows.append({"Parameter": f"W_H{j+1}_O1", "Nilai_Awal": model.W2[j, 0]})
    param_rows.append({"Parameter": "Bias_O1", "Nilai_Awal": model.b2})
    pd.DataFrame(param_rows).to_csv(out_dir / "04_bobot_bias_awal_arsitektur_5-3-1.csv", index=False)

    W1_old, b1_old, W2_old, b2_old = model.W1.copy(), model.b1.copy(), model.W2.copy(), model.b2
    net_h, out_h, net_o, out_o = model.forward_one(sample)
    error = float(target - out_o)
    delta_o = error * out_o * (1.0 - out_o)
    delta_h = (delta_o * W2_old[:, 0]) * out_h * (1.0 - out_h)

    ff_rows = []
    for i, val in enumerate(sample, start=1):
        ff_rows.append({"Tahap": "Input", "Neuron": f"X{i}", "Net": np.nan, "Output": float(val)})
    for j in range(3):
        ff_rows.append({"Tahap": "Hidden", "Neuron": f"H{j+1}", "Net": float(net_h[j]), "Output": float(out_h[j])})
    ff_rows.append({"Tahap": "Output", "Neuron": "O1", "Net": float(net_o), "Output": float(out_o)})
    pd.DataFrame(ff_rows).to_csv(out_dir / "05_feedforward_contoh_5-3-1.csv", index=False)

    delta_rows = [{"Neuron": "O1", "Target": target, "Output": out_o, "Error_(t-y)": error, "Delta": delta_o}]
    for j in range(3):
        delta_rows.append({"Neuron": f"H{j+1}", "Target": np.nan, "Output": float(out_h[j]), "Error_(t-y)": np.nan, "Delta": float(delta_h[j])})
    pd.DataFrame(delta_rows).to_csv(out_dir / "06_error_delta_contoh_5-3-1.csv", index=False)

    update_rows = []
    for i in range(5):
        for j in range(3):
            change = alpha * sample[i] * delta_h[j]
            update_rows.append({"Parameter": f"W_X{i+1}_H{j+1}", "Nilai_Lama": W1_old[i, j], "Perubahan": change, "Nilai_Baru": W1_old[i, j] + change})
    for j in range(3):
        change = alpha * delta_h[j]
        update_rows.append({"Parameter": f"Bias_H{j+1}", "Nilai_Lama": b1_old[j], "Perubahan": change, "Nilai_Baru": b1_old[j] + change})
    for j in range(3):
        change = alpha * out_h[j] * delta_o
        update_rows.append({"Parameter": f"W_H{j+1}_O1", "Nilai_Lama": W2_old[j, 0], "Perubahan": change, "Nilai_Baru": W2_old[j, 0] + change})
    change = alpha * delta_o
    update_rows.append({"Parameter": "Bias_O1", "Nilai_Lama": b2_old, "Perubahan": change, "Nilai_Baru": b2_old + change})
    pd.DataFrame(update_rows).to_csv(out_dir / "07_update_bobot_bias_contoh_5-3-1.csv", index=False)


def plot_architecture(hidden_units, out_path):
    n_input, n_output = 5, 1
    fig, ax = plt.subplots(figsize=(11, 6))
    x_positions = [0.12, 0.50, 0.88]
    input_y = np.linspace(0.12, 0.88, n_input)
    hidden_y = np.linspace(0.08, 0.92, hidden_units)
    output_y = [0.5]
    # Connections
    for yi in input_y:
        for yh in hidden_y:
            ax.plot([x_positions[0], x_positions[1]], [yi, yh], linewidth=0.65, alpha=0.6)
    for yh in hidden_y:
        ax.plot([x_positions[1], x_positions[2]], [yh, output_y[0]], linewidth=0.65, alpha=0.6)
    ax.scatter([x_positions[0]] * n_input, input_y, s=750, edgecolors="black", zorder=3)
    ax.scatter([x_positions[1]] * hidden_units, hidden_y, s=520, edgecolors="black", zorder=3)
    ax.scatter(x_positions[2], output_y, s=850, edgecolors="black", zorder=3)
    for i, yv in enumerate(input_y, start=1):
        ax.text(x_positions[0], yv, f"X{i}", ha="center", va="center", fontsize=10, zorder=4)
    for j, yv in enumerate(hidden_y, start=1):
        ax.text(x_positions[1], yv, f"H{j}", ha="center", va="center", fontsize=9, zorder=4)
    ax.text(x_positions[2], output_y[0], "Y", ha="center", va="center", fontsize=12, zorder=4)
    ax.text(x_positions[0], 1.04, "Input Layer\n5 neuron", ha="center", va="bottom", fontsize=12)
    ax.text(x_positions[1], 1.04, f"Hidden Layer\n{hidden_units} neuron", ha="center", va="bottom", fontsize=12)
    ax.text(x_positions[2], 1.04, "Output Layer\n1 neuron", ha="center", va="bottom", fontsize=12)
    ax.text(0.5, -0.08, f"Arsitektur Backpropagation 5-{hidden_units}-1 | Aktivasi sigmoid biner", ha="center", fontsize=11)
    ax.set_xlim(0, 1)
    ax.set_ylim(-0.14, 1.18)
    ax.axis("off")
    fig.tight_layout()
    fig.savefig(out_path, dpi=220, bbox_inches="tight")
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=INPUT_DEFAULT)
    parser.add_argument("--sheet", default=SHEET_DEFAULT)
    parser.add_argument("--output", default="/mnt/data/Backpropagation_Python/hasil")
    parser.add_argument("--epochs", type=int, default=MAX_EPOCHS)
    parser.add_argument("--alpha", type=float, default=ALPHA)
    parser.add_argument("--seed", type=int, default=SEED)
    args = parser.parse_args()

    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)
    df = pd.read_excel(args.input, sheet_name=args.sheet, dtype={"NOBP": str})
    required = ["NOBP", "Nama Lengkap", *FEATURES, "Cluster_KMeans", "Kategori_KMeans", "Target_BP"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Kolom wajib tidak ditemukan: {missing}")
    df = df[required].copy()
    df["NOBP"] = df["NOBP"].astype("string").str.strip()
    df[FEATURES] = df[FEATURES].apply(pd.to_numeric, errors="coerce")
    df["Target_BP"] = pd.to_numeric(df["Target_BP"], errors="coerce")
    if df[FEATURES + ["Target_BP"]].isna().any().any():
        raise ValueError("Ada nilai kosong/non-numerik pada atribut input atau target.")
    X = df[FEATURES].to_numpy(dtype=float)
    y = df["Target_BP"].to_numpy(dtype=int)
    if not set(np.unique(y)).issubset({0, 1}):
        raise ValueError("Target_BP harus berupa 0 dan 1. Pemetaan internal belum sesuai.")
    if len(df) != 435:
        warnings.warn(f"Jumlah data saat ini {len(df)}, bukan 435. Pembagian data mengikuti 80:20 dari jumlah aktual.")

    # Data/target table in the same order as input file.
    data_out = df.copy()
    data_out["Keterangan_Target_BP"] = np.where(data_out["Target_BP"] == 1, "Layak", "Tidak Layak")
    data_out.to_csv(out_dir / "01_data_input_dan_target_435.csv", index=False)

    train_idx, test_idx = group_stratified_split(df, seed=args.seed)
    split_rows = []
    for split_name, indices in [("Training", train_idx), ("Testing", test_idx)]:
        for idx in indices:
            split_rows.append({"Indeks_Data": int(idx + 1), "NOBP": df.iloc[idx]["NOBP"], "Nama_Lengkap": df.iloc[idx]["Nama Lengkap"], "Kelompok": split_name, "Target_BP": int(y[idx]), "Kategori": "Layak" if y[idx] == 1 else "Tidak Layak"})
    split_df = pd.DataFrame(split_rows)
    split_df.to_csv(out_dir / "02_pembagian_training_testing.csv", index=False)

    # Audit repeated identities and whether the same NOBP appears in both partitions.
    duplicate_counts = df.groupby("NOBP", dropna=False).size().rename("Jumlah_Record").reset_index()
    duplicate_counts = duplicate_counts[duplicate_counts["Jumlah_Record"] > 1]
    duplicate_counts.to_csv(out_dir / "03_audit_nobp_berulang.csv", index=False)

    # Identify NOBP values whose records receive more than one K-Means class.
    conflicted_ids = df.groupby("NOBP")["Target_BP"].nunique()
    conflicted_ids = conflicted_ids[conflicted_ids > 1].index
    conflict_df = df[df["NOBP"].isin(conflicted_ids)][["NOBP", "Nama Lengkap", *FEATURES, "Cluster_KMeans", "Kategori_KMeans", "Target_BP"]]
    conflict_df.to_csv(out_dir / "04_audit_nobp_dengan_target_berbeda.csv", index=False)

    # Determine whether any individual input attribute perfectly determines the target.
    feature_audit = []
    for col in FEATURES:
        by_value = df.groupby(col)["Target_BP"].agg(["count", "nunique"]).reset_index()
        accuracy_one_feature = 0
        for _, grp in df.groupby(col):
            accuracy_one_feature += int(grp["Target_BP"].value_counts().max())
        feature_audit.append({
            "Atribut": col, "Jumlah_Nilai_Unik": int(df[col].nunique()),
            "Akurasi_Aturan_satu_atribut": accuracy_one_feature / len(df),
            "Setiap_nilai_mewakili_satu_target": bool((by_value["nunique"] == 1).all()),
        })
    pd.DataFrame(feature_audit).to_csv(out_dir / "05_audit_hubungan_atribut_dan_target.csv", index=False)
    pair_audit = pd.DataFrame({
        "Pemeriksaan": ["X4 identik dengan X5", "X4 identik dengan Target_BP", "X5 identik dengan Target_BP"],
        "Hasil": [
            bool(np.array_equal(df["X4_Prestasi_Akademik"].to_numpy(), df["X5_Prestasi_NonAkademik"].to_numpy())),
            bool(np.array_equal(df["X4_Prestasi_Akademik"].to_numpy(), df["Target_BP"].to_numpy())),
            bool(np.array_equal(df["X5_Prestasi_NonAkademik"].to_numpy(), df["Target_BP"].to_numpy())),
        ],
    })
    pair_audit.to_csv(out_dir / "06_audit_kecocokan_x4_x5_dengan_target.csv", index=False)

    train_ids = set(df.iloc[train_idx]["NOBP"].astype(str))
    test_ids = set(df.iloc[test_idx]["NOBP"].astype(str))
    overlap_ids = sorted(train_ids & test_ids)
    audit_summary = {
        "Jumlah_record": int(len(df)),
        "Jumlah_NOBP_unik": int(df["NOBP"].nunique()),
        "Jumlah_NOBP_berulang": int((df.groupby("NOBP").size() > 1).sum()),
        "Jumlah_NOBP_muncul_di_training_dan_testing": int(len(overlap_ids)),
        "NOBP_overlap": overlap_ids,
        "Jumlah_NOBP_dengan_target_berbeda": int(len(conflicted_ids)),
        "X4_identik_X5": bool(np.array_equal(df["X4_Prestasi_Akademik"].to_numpy(), df["X5_Prestasi_NonAkademik"].to_numpy())),
        "X4_identik_target": bool(np.array_equal(df["X4_Prestasi_Akademik"].to_numpy(), y)),
        "X5_identik_target": bool(np.array_equal(df["X5_Prestasi_NonAkademik"].to_numpy(), y)),
        "Training": int(len(train_idx)),
        "Testing": int(len(test_idx)),
        "NOBP_training": int(len(train_ids)),
        "NOBP_testing": int(len(test_ids)),
        "Metode_pembagian": "Group split berdasarkan NOBP menggunakan optimasi integer (MILP)",
        "Distribusi_training_target_0_1": {str(k): int(v) for k, v in pd.Series(y[train_idx]).value_counts().sort_index().items()},
        "Distribusi_testing_target_0_1": {str(k): int(v) for k, v in pd.Series(y[test_idx]).value_counts().sort_index().items()},
    }
    (out_dir / "audit_dataset.json").write_text(json.dumps(audit_summary, indent=2, ensure_ascii=False), encoding="utf-8")

    # Sample trace uses Lyra Alda Fitria if present; otherwise first row.
    lyra = df.index[df["Nama Lengkap"].astype(str).str.strip().str.casefold() == "lyra alda fitria"].tolist()
    sample_idx = lyra[0] if lyra else 0
    build_trace(X[sample_idx], int(y[sample_idx]), args.seed + 300, args.alpha, out_dir)

    # Train and test all 10 architectures with identical row split.
    summaries, histories, all_test_predictions = [], [], []
    trained_models = {}
    for H in HIDDEN_UNITS:
        model = Backpropagation(X.shape[1], H, args.seed + H)
        hist = model.train(X[train_idx], y[train_idx], alpha=args.alpha, epochs=args.epochs, seed=args.seed + 1000 + H)
        hist.insert(0, "Arsitektur", f"5-{H}-1")
        histories.append(hist)
        prob = model.predict_proba(X[test_idx])
        metrics, pred = classification_metrics(y[test_idx], prob)
        summaries.append({"Arsitektur": f"5-{H}-1", "Input": 5, "Hidden": H, "Output": 1, "Jumlah_Bobot_dan_Bias": 7 * H + 1, "Epoch": args.epochs, "Learning_Rate": args.alpha, **metrics})
        for local_i, original_idx in enumerate(test_idx):
            row = df.iloc[original_idx]
            all_test_predictions.append({
                "Arsitektur": f"5-{H}-1", "Indeks_Data": int(original_idx + 1),
                "NOBP": row["NOBP"], "Nama_Lengkap": row["Nama Lengkap"],
                "Target_Aktual_0_1": int(y[original_idx]),
                "Kategori_Aktual": "Layak" if y[original_idx] == 1 else "Tidak Layak",
                "Output_Sigmoid": float(prob[local_i]), "Prediksi_0_1": int(pred[local_i]),
                "Kategori_Prediksi": "Layak" if pred[local_i] == 1 else "Tidak Layak",
                "Benar": bool(pred[local_i] == y[original_idx]),
            })
        trained_models[H] = model

    summary_df = pd.DataFrame(summaries)
    summary_df = summary_df.sort_values(["Akurasi", "MSE"], ascending=[False, True]).reset_index(drop=True)
    summary_df.insert(0, "Peringkat", np.arange(1, len(summary_df) + 1))
    summary_df.to_csv(out_dir / "08_evaluasi_10_arsitektur.csv", index=False)
    pd.concat(histories, ignore_index=True).to_csv(out_dir / "09_riwayat_error_training_semua_arsitektur.csv", index=False)
    pred_df = pd.DataFrame(all_test_predictions)
    pred_df.to_csv(out_dir / "10_hasil_testing_semua_arsitektur.csv", index=False)

    best_name = summary_df.iloc[0]["Arsitektur"]
    best_H = int(summary_df.iloc[0]["Hidden"])
    best_model = trained_models[best_H]
    best_prob = best_model.predict_proba(X[test_idx])
    _, best_pred = classification_metrics(y[test_idx], best_prob)
    best_test = df.iloc[test_idx][["NOBP", "Nama Lengkap", *FEATURES, "Cluster_KMeans", "Kategori_KMeans", "Target_BP"]].copy()
    best_test["Output_Sigmoid"] = best_prob
    best_test["Prediksi_BP_0_1"] = best_pred
    best_test["Kategori_Prediksi"] = np.where(best_pred == 1, "Layak", "Tidak Layak")
    best_test["Hasil"] = np.where(best_pred == y[test_idx], "Benar", "Salah")
    best_test.to_csv(out_dir / f"11_hasil_testing_arsitektur_terbaik_{best_name}.csv", index=False)

    # Save the final parameters for all architectures, with a separate best-model file.
    parameter_rows = []
    for H, model in trained_models.items():
        for i in range(model.W1.shape[0]):
            for j in range(model.W1.shape[1]):
                parameter_rows.append({"Arsitektur": f"5-{H}-1", "Parameter": f"W_X{i+1}_H{j+1}", "Nilai_Akhir": float(model.W1[i, j])})
        for j, val in enumerate(model.b1, start=1):
            parameter_rows.append({"Arsitektur": f"5-{H}-1", "Parameter": f"Bias_H{j}", "Nilai_Akhir": float(val)})
        for j in range(model.W2.shape[0]):
            parameter_rows.append({"Arsitektur": f"5-{H}-1", "Parameter": f"W_H{j+1}_O1", "Nilai_Akhir": float(model.W2[j, 0])})
        parameter_rows.append({"Arsitektur": f"5-{H}-1", "Parameter": "Bias_O1", "Nilai_Akhir": float(model.b2)})
    pd.DataFrame(parameter_rows).to_csv(out_dir / "12_bobot_bias_akhir_semua_arsitektur.csv", index=False)

    # Architecture illustration for the selected model.
    plot_architecture(best_H, out_dir / f"13_arsitektur_terbaik_{best_name}.png")

    # Accuracy and MSE comparison charts.
    plot_df = summary_df.sort_values("Hidden")
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(plot_df["Arsitektur"], plot_df["Akurasi"] * 100)
    ax.set_title("Perbandingan Akurasi Pengujian 10 Arsitektur Backpropagation")
    ax.set_xlabel("Arsitektur")
    ax.set_ylabel("Akurasi (%)")
    ax.set_ylim(0, 105)
    ax.grid(axis="y", alpha=0.25)
    fig.tight_layout()
    fig.savefig(out_dir / "14_grafik_perbandingan_akurasi.png", dpi=220)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(plot_df["Arsitektur"], plot_df["MSE"], marker="o")
    ax.set_title("Perbandingan MSE Pengujian 10 Arsitektur Backpropagation")
    ax.set_xlabel("Arsitektur")
    ax.set_ylabel("Mean Squared Error")
    ax.grid(alpha=0.25)
    fig.tight_layout()
    fig.savefig(out_dir / "15_grafik_perbandingan_mse.png", dpi=220)
    plt.close(fig)

    # Best architecture loss curve.
    best_hist = histories[best_H - 3].copy()  # H values are ordered 3..12.
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(best_hist["Epoch"], best_hist["MSE_Training"])
    ax.set_title(f"Perubahan MSE Training Arsitektur {best_name}")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("MSE Training")
    ax.grid(alpha=0.25)
    fig.tight_layout()
    fig.savefig(out_dir / "16_grafik_mse_training_arsitektur_terbaik.png", dpi=220)
    plt.close(fig)

    result_info = {
        "Input": str(Path(args.input).resolve()),
        "Jumlah_data": int(len(df)), "Jumlah_input": int(X.shape[1]),
        "Target_internal": {"Layak": 1, "Tidak Layak": 0},
        "Training": int(len(train_idx)), "Testing": int(len(test_idx)),
        "NOBP_training": int(len(train_ids)), "NOBP_testing": int(len(test_ids)),
        "Metode_pembagian": "Group split berdasarkan NOBP menggunakan optimasi integer (MILP)",
        "Learning_rate": args.alpha, "Epoch_maksimum": args.epochs,
        "Seed": args.seed, "Arsitektur_terbaik": best_name,
        "Kriteria_pemilihan": "Akurasi tertinggi, kemudian MSE terendah",
        "Catatan_duplikasi_NOBP": "Seluruh record dengan NOBP sama ditempatkan pada satu kelompok; tidak ada NOBP yang tumpang tindih antara training dan testing. Delapan NOBP memiliki target berbeda pada record berbeda dan perlu ditelusuri.",
    }
    (out_dir / "ringkasan_program.json").write_text(json.dumps(result_info, indent=2, ensure_ascii=False), encoding="utf-8")

    # Package all outputs for easy handoff.
    zip_path = out_dir.parent / "Paket_Hasil_Backpropagation.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(out_dir.iterdir()):
            if p.is_file():
                zf.write(p, arcname=f"hasil/{p.name}")
        zf.write(Path(__file__), arcname="program_backpropagation.py")

    print("=== HASIL BACKPROPAGATION ===")
    print(f"Jumlah data: {len(df)} | Training: {len(train_idx)} | Testing: {len(test_idx)}")
    print(f"Target internal: Layak=1, Tidak Layak=0 | Alpha={args.alpha} | Epoch={args.epochs}")
    print(f"Jumlah NOBP unik: {df['NOBP'].nunique()} | NOBP berulang: {(df.groupby('NOBP').size() > 1).sum()} | NOBP lintas training-testing: {len(overlap_ids)}")
    print(summary_df.to_string(index=False, float_format=lambda v: f"{v:.6f}"))
    print(f"Arsitektur terbaik: {best_name}")
    print(f"Output: {out_dir}")
    print(f"Paket: {zip_path}")


if __name__ == "__main__":
    main()
