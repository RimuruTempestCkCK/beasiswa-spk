import numpy as np
import joblib
import os
from typing import Dict, Any, List
from sklearn.cluster import KMeans
from sklearn.metrics import davies_bouldin_score


def run_kmeans(X_normalized: np.ndarray, k: int, random_seed: int = 42) -> Dict[str, Any]:
    """
    Run K-Means clustering.

    Args:
        X_normalized: numpy array shape (n_samples, 6) - already normalized
        k: number of clusters
        random_seed: seed for reproducibility

    Returns:
        dict with labels, centroids, dbi_score, distances
    """
    kmeans = KMeans(n_clusters=k, random_state=random_seed, n_init=10)
    labels = kmeans.fit_predict(X_normalized)
    centroids = kmeans.cluster_centers_

    # Davies-Bouldin Index (lower is better)
    if len(set(labels)) > 1:
        dbi = float(davies_bouldin_score(X_normalized, labels))
    else:
        dbi = float("inf")

    # Distance to centroid per sample
    distances = []
    for i, label in enumerate(labels):
        dist = float(np.linalg.norm(X_normalized[i] - centroids[label]))
        distances.append(dist)

    return {
        "labels": labels.tolist(),
        "centroids": centroids.tolist(),
        "dbi_score": dbi,
        "distances": distances,
    }


def run_kmeans_multiple_k(
    X_normalized: np.ndarray,
    k_values: List[int],
    random_seed: int = 42,
) -> List[Dict[str, Any]]:
    """
    Run K-Means for multiple k values and return results for each.
    """
    results = []
    for k in k_values:
        result = run_kmeans(X_normalized, k, random_seed)
        result["k_value"] = k
        results.append(result)
    return results


def compute_cluster_profiles(
    X_normalized: np.ndarray,
    labels: List[int],
    centroids: List[List[float]],
    feature_names: List[str],
) -> List[Dict[str, Any]]:
    """
    Compute profile statistics for each cluster.
    """
    labels_arr = np.array(labels)
    profiles = []
    unique_labels = sorted(set(labels))

    for label in unique_labels:
        mask = labels_arr == label
        cluster_data = X_normalized[mask]
        feat_means = {
            feat: float(cluster_data[:, i].mean())
            for i, feat in enumerate(feature_names)
        }
        profile = {
            "cluster_label": int(label),
            "count": int(mask.sum()),
            "centroid": centroids[label] if label < len(centroids) else [],
            "feature_means": feat_means,
            "mean_ipk": feat_means.get("ipk"),
            "mean_income": feat_means.get("parent_income"),
            "mean_dependents": feat_means.get("family_dependents"),
            "mean_academic": feat_means.get("academic_achievement_score"),
            "mean_nonacademic": feat_means.get("nonacademic_achievement_score"),
            "mean_attendance": feat_means.get("attendance_percentage"),
        }
        profiles.append(profile)
    return profiles


def save_clustering_artifact(
    artifact_path: str,
    result: Dict[str, Any],
    k_value: int,
) -> None:
    os.makedirs(os.path.dirname(artifact_path), exist_ok=True)
    joblib.dump({"result": result, "k_value": k_value}, artifact_path)


def load_clustering_artifact(artifact_path: str) -> Dict[str, Any]:
    return joblib.load(artifact_path)
