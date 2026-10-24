import pandas as pd
import numpy as np
import joblib
import os
from typing import Tuple, Dict, Any, List, Optional

from app.ml.data_validation import REQUIRED_FEATURES, FEATURE_RANGES

from sklearn.preprocessing import MinMaxScaler


def impute_medians(df: pd.DataFrame, medians: Optional[Dict[str, float]] = None) -> Tuple[pd.DataFrame, Dict[str, float]]:
    """
    Impute missing values with median.
    If medians dict is provided (for test data), use those medians.
    Otherwise compute from df (for training data).
    Returns (imputed_df, medians_dict).
    """
    df = df.copy()
    computed_medians = {}
    for feature in REQUIRED_FEATURES:
        if feature not in df.columns:
            continue
        if medians is not None:
            median_val = medians.get(feature, 0.0)
        else:
            median_val = df[feature].median()
            if pd.isna(median_val):
                median_val = 0.0
        computed_medians[feature] = float(median_val)
        df[feature] = df[feature].fillna(median_val)
    return df, computed_medians


def fix_range_violations(df: pd.DataFrame) -> pd.DataFrame:
    """Clip values to valid ranges."""
    df = df.copy()
    df["ipk"] = df["ipk"].clip(0.0, 4.0)
    df["parent_income"] = df["parent_income"].clip(lower=0.000001)
    df["family_dependents"] = df["family_dependents"].clip(lower=0)
    df["academic_achievement_score"] = df["academic_achievement_score"].clip(lower=0.0)
    df["nonacademic_achievement_score"] = df["nonacademic_achievement_score"].clip(lower=0.0)
    df["attendance_percentage"] = df["attendance_percentage"].clip(0.0, 100.0)
    return df


def preprocess_train(df: pd.DataFrame) -> Tuple[np.ndarray, MinMaxScaler, Dict[str, float]]:
    """
    Full preprocessing pipeline for training data.
    1. Impute missing values with median
    2. Fix range violations
    3. Fit MinMaxScaler and normalize
    Returns (X_normalized, scaler, medians).
    """
    df, medians = impute_medians(df)
    df = fix_range_violations(df)
    X = df[REQUIRED_FEATURES].values.astype(float)
    scaler = MinMaxScaler()
    X_normalized = scaler.fit_transform(X)
    return X_normalized, scaler, medians


def preprocess_transform(
    df: pd.DataFrame,
    scaler: MinMaxScaler,
    medians: Dict[str, float],
) -> np.ndarray:
    """
    Apply already-fitted scaler and medians to new data (test/inference).
    """
    df, _ = impute_medians(df, medians=medians)
    df = fix_range_violations(df)
    X = df[REQUIRED_FEATURES].values.astype(float)
    X_normalized = scaler.transform(X)
    return X_normalized


def preprocess_single(
    features: Dict[str, float],
    scaler: MinMaxScaler,
    medians: Dict[str, float],
) -> np.ndarray:
    """
    Preprocess a single record for inference.
    """
    df = pd.DataFrame([features])
    X = preprocess_transform(df, scaler, medians)
    return X


def save_preprocessing_artifact(
    artifact_path: str,
    scaler: MinMaxScaler,
    medians: Dict[str, float],
    config: Dict[str, Any],
) -> None:
    os.makedirs(os.path.dirname(artifact_path), exist_ok=True)
    joblib.dump(
        {"scaler": scaler, "medians": medians, "config": config},
        artifact_path,
    )


def load_preprocessing_artifact(artifact_path: str) -> Dict[str, Any]:
    return joblib.load(artifact_path)
