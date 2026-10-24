import pandas as pd
import numpy as np
from typing import List, Tuple, Dict, Any

REQUIRED_FEATURES = [
    "ipk",
    "parent_income",
    "family_dependents",
    "academic_achievement_score",
    "nonacademic_achievement_score",
    "attendance_percentage",
]

FEATURE_RANGES = {
    "ipk": (0.0, 4.0),
    "parent_income": (0.000001, None),  # > 0
    "family_dependents": (0, None),     # >= 0
    "academic_achievement_score": (0.0, None),   # >= 0
    "nonacademic_achievement_score": (0.0, None),# >= 0
    "attendance_percentage": (0.0, 100.0),
}


def validate_dataframe(df: pd.DataFrame) -> Tuple[int, int, List[Dict[str, Any]]]:
    """
    Validate a DataFrame for required columns and value ranges.
    Returns (valid_rows, invalid_rows, issues_list).
    """
    issues = []
    invalid_indices = set()

    # Check required columns
    missing_cols = [col for col in REQUIRED_FEATURES if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")

    for idx, row in df.iterrows():
        row_issues = []

        for feature in REQUIRED_FEATURES:
            val = row.get(feature)

            # Check missing
            if pd.isna(val):
                row_issues.append(f"{feature}: missing value")
                continue

            # Check ranges
            low, high = FEATURE_RANGES[feature]
            try:
                val_float = float(val)
                if low is not None and val_float < low:
                    row_issues.append(f"{feature}: value {val_float} below minimum {low}")
                if high is not None and val_float > high:
                    row_issues.append(f"{feature}: value {val_float} above maximum {high}")
            except (TypeError, ValueError):
                row_issues.append(f"{feature}: non-numeric value '{val}'")

        if row_issues:
            invalid_indices.add(idx)
            issues.append({
                "row": int(idx) + 1,
                "student_code": row.get("student_code", "N/A"),
                "issues": row_issues,
            })

    total = len(df)
    invalid = len(invalid_indices)
    valid = total - invalid
    return valid, invalid, issues
