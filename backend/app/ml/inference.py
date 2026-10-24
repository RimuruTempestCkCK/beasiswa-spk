import numpy as np
from typing import Dict, Any, Tuple, List, Optional

from app.ml.backpropagation import load_model_artifact
from app.ml.preprocessing import preprocess_single
from app.ml.data_validation import REQUIRED_FEATURES


def predict_single(
    artifact_path: str,
    features: Dict[str, float],
) -> Tuple[int, float]:
    """
    Run inference for a single record.

    Args:
        artifact_path: path to the model artifact
        features: dict with feature keys matching REQUIRED_FEATURES

    Returns:
        (predicted_cluster, confidence_score)
    """
    artifact = load_model_artifact(artifact_path)
    model = artifact["model"]
    scaler = artifact["scaler"]
    medians = artifact["medians"]

    X = preprocess_single(features, scaler, medians)
    predicted_cluster = int(model.predict(X)[0])

    # Confidence: max probability from predict_proba
    try:
        proba = model.predict_proba(X)[0]
        confidence = float(proba.max())
    except Exception:
        confidence = 0.0

    return predicted_cluster, confidence
