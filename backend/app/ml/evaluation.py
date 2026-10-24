import numpy as np
from typing import Dict, Any, List
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report,
)
from sklearn.neural_network import MLPClassifier


def evaluate_model(
    model: MLPClassifier,
    X_test: np.ndarray,
    y_test: np.ndarray,
) -> Dict[str, Any]:
    """
    Evaluate a trained MLP model on test data.

    Returns dict with all evaluation metrics.
    """
    y_pred = model.predict(X_test)
    y_test_arr = np.array(y_test)
    unique_classes = sorted(set(y_test.tolist()))

    per_class = {}
    for cls in unique_classes:
        per_class[str(cls)] = {
            "precision": float(precision_score(y_test, y_pred, labels=[cls], average="macro", zero_division=0)),
            "recall": float(recall_score(y_test, y_pred, labels=[cls], average="macro", zero_division=0)),
            "f1": float(f1_score(y_test, y_pred, labels=[cls], average="macro", zero_division=0)),
            "support": int((y_test_arr == cls).sum()),
        }

    return {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision_macro": float(precision_score(y_test, y_pred, average="macro", zero_division=0)),
        "recall_macro": float(recall_score(y_test, y_pred, average="macro", zero_division=0)),
        "f1_macro": float(f1_score(y_test, y_pred, average="macro", zero_division=0)),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "classification_report": classification_report(
            y_test, y_pred, output_dict=True, zero_division=0
        ),
        "per_class": per_class,
        "n_test_samples": int(len(y_test)),
        "n_train_samples": 0,  # filled by caller
    }
