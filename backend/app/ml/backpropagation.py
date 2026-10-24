import numpy as np
import joblib
import os
from typing import Dict, Any, List, Tuple

from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split


def train_model(
    X: np.ndarray,
    y: List[int],
    config: Dict[str, Any],
) -> Tuple[MLPClassifier, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Train an MLP Backpropagation classifier.

    Args:
        X: numpy array shape (n_samples, 6) - normalized features
        y: list of cluster labels (int)
        config: training configuration dict

    Returns:
        (model, X_train, X_test, y_train, y_test)
    """
    y_arr = np.array(y)
    unique_classes = np.unique(y_arr)

    test_size = config.get("test_size", 0.2)
    random_state = config.get("random_state", 42)

    # Use stratified split if possible
    stratify = y_arr if len(unique_classes) > 1 and len(y_arr) * test_size >= len(unique_classes) else None

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_arr,
        test_size=test_size,
        random_state=random_state,
        stratify=stratify,
    )

    hidden_layers = tuple(config.get("hidden_layer_sizes", [64, 32]))

    mlp = MLPClassifier(
        hidden_layer_sizes=hidden_layers,
        learning_rate_init=config.get("learning_rate_init", 0.001),
        max_iter=config.get("max_iter", 500),
        random_state=random_state,
        activation=config.get("activation", "relu"),
        early_stopping=True,
        validation_fraction=0.1,
        n_iter_no_change=20,
    )

    mlp.fit(X_train, y_train)
    return mlp, X_train, X_test, y_train, y_test


def save_model_artifact(
    artifact_path: str,
    model: MLPClassifier,
    scaler: Any,
    medians: Dict[str, float],
    config: Dict[str, Any],
) -> None:
    """Save model + scaler + medians as a single joblib artifact."""
    os.makedirs(os.path.dirname(artifact_path), exist_ok=True)
    joblib.dump(
        {
            "model": model,
            "scaler": scaler,
            "medians": medians,
            "config": config,
        },
        artifact_path,
    )


def load_model_artifact(artifact_path: str) -> Dict[str, Any]:
    return joblib.load(artifact_path)
