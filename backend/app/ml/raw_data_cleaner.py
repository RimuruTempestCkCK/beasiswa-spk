import re
import pandas as pd
from typing import Tuple, List, Dict, Any, Optional

def parse_ips_value(val: Any) -> Optional[float]:
    """Parse IPS value handling comma, trailing text, etc."""
    if val is None or pd.isna(val):
        return None
    s = str(val).strip()
    if s in ["-", "", "Belum ada", "None", "nan"]:
        return None
    s = s.replace(",", ".").replace(" ", "")
    match = re.search(r"([0-4](\.[0-9]+)?)", s)
    if match:
        v = float(match.group(1))
        return round(v, 2)
    return None

def parse_income_value(val: Any) -> float:
    """Parse raw text/number Indonesian income to numeric rupiah float."""
    if val is None or pd.isna(val):
        return 0.0
    if isinstance(val, (int, float)):
        if val == 500:
            return 500000.0
        return float(val)
    s = str(val).strip().lower()
    if s in ["-", "none", "", "nan"]:
        return 0.0
    if any(k in s for k in ["tidak ada", "tidak berpenghasilan", "tidak bekerja", "tidak berkerja", "tidak punya"]):
        return 0.0
    if "250.001 - rp. 500.000" in s: return 375000.0
    if "500.001 - rp. 750.000" in s: return 625000.0
    if "750.001 - rp. 1.000.000" in s: return 875000.0
    if "1.000.001 - rp. 1.250.000" in s: return 1125000.0
    if "1.250.001 - rp. 1.500.000" in s: return 1375000.0
    if "1.500.001 - rp. 1.750.000" in s: return 1625000.0
    if "1.750.001 - rp. 2.000.000" in s: return 1875000.0
    if "2.000.001 - rp. 2.250.000" in s: return 2125000.0
    if "2.250.001 - rp. 2.500.000" in s: return 2375000.0
    if "2.500.001 - rp. 2.750.000" in s: return 2625000.0
    if "2.750.001 - rp. 3.000.000" in s: return 2875000.0
    if "3.000.001 - rp. 3.250.000" in s: return 3125000.0
    if "< rp. 250.000" in s: return 250000.0
    if "<300rb" in s or "300 ribu" in s: return 300000.0
    if "< 500.000" in s or "<500" in s or "dibawah 500" in s or "500rb" in s: return 500000.0
    if "<1jt" in s or "kurang dari 1jt" in s or "kurang 1 juta" in s or "kurang dari satu juta" in s or "dibawah 1 juta" in s: return 800000.0
    if "<2jt" in s: return 1500000.0
    if "<3jt" in s: return 2500000.0
    if "<5jt" in s: return 4000000.0
    if ">5jt" in s: return 5500000.0
    if "1jt" in s: return 1000000.0
    if "1.100.000" in s: return 1100000.0
    if "700.000" in s or "700-800" in s: return 750000.0
    if "kurang lebih 3 jt" in s: return 3000000.0
    if "-+1.000.000" in s: return 1000000.0
    if "tidak menentu" in s or "pemasukan tidak tetap" in s or "biaya dari kakak" in s or "jual makan harian" in s: return 600000.0

    clean = re.sub(r"[^0-9]", "", s)
    if clean:
        val_int = float(clean)
        if val_int == 500: return 500000.0
        return val_int
    return 0.0

def parse_dependents_value(val: Any) -> int:
    """Parse dependents text like '4 Orang' or numbers to int."""
    if val is None or pd.isna(val):
        return 1
    s = str(val).strip().lower()
    if "tunggal" in s:
        return 1
    match = re.search(r"\d+", s)
    if match:
        return int(match.group(0))
    return 1

def parse_binary_achievement(val: Any) -> float:
    """Parse achievement indicator to 0.0 or 1.0."""
    if val is None or pd.isna(val):
        return 0.0
    s = str(val).strip()
    if s in ["1", "1.0", 1]:
        return 1.0
    return 0.0

def clean_and_transform_raw_dataset(df: pd.DataFrame) -> Tuple[pd.DataFrame, int, int]:
    """
    Transforms raw uploaded Dataframe into the 5 canon research features.
    Handles raw Excel format like 'Data Awal beasiswa.xlsx'.
    Returns (cleaned_df, raw_count, dropped_count).
    """
    df = df.copy()
    raw_count = len(df)

    # 1. Check if first row is accidentally None/empty header (common in openpyxl/pandas Excel reading)
    # Check if 'Unnamed: 0' or similar and look for header row
    cols_str = " ".join([str(c).lower() for c in df.columns])
    if "nama" not in cols_str and "ips" not in cols_str and "ipk" not in cols_str:
        # Check first row
        first_row_vals = [str(x).lower() for x in df.iloc[0].values if pd.notna(x)]
        first_row_str = " ".join(first_row_vals)
        if "nama" in first_row_str or "ips" in first_row_str:
            df.columns = df.iloc[0]
            df = df.iloc[1:].reset_index(drop=True)

    # 2. Map standard header names
    col_mapping = {}
    for c in df.columns:
        c_clean = str(c).strip().lower()
        if "nama" in c_clean:
            col_mapping[c] = "student_name"
        elif "nim" in c_clean or "npm" in c_clean or "kode" in c_clean:
            col_mapping[c] = "student_code"
        elif "ips" in c_clean or "ipk" in c_clean or "rata" in c_clean:
            col_mapping[c] = "ipk"
        elif "penghasilan" in c_clean or "gaji" in c_clean or "income" in c_clean:
            col_mapping[c] = "parent_income"
        elif "tanggung" in c_clean or "saudara" in c_clean or "dependent" in c_clean:
            col_mapping[c] = "family_dependents"
        elif "non-akademik" in c_clean or "non akademik" in c_clean or "non_akademik" in c_clean or "nonakademik" in c_clean:
            col_mapping[c] = "nonacademic_achievement_score"
        elif "akademik" in c_clean:
            col_mapping[c] = "academic_achievement_score"
        elif "kehadiran" in c_clean or "attendance" in c_clean:
            col_mapping[c] = "attendance_percentage"

    df = df.rename(columns=col_mapping)

    # 3. Apply cell transformations
    if "ipk" in df.columns:
        df["ipk"] = df["ipk"].apply(parse_ips_value)
        # Drop rows where IPS is None (unassessed/invalid records)
        df = df[df["ipk"].notna()].copy()

    if "parent_income" in df.columns:
        df["parent_income"] = df["parent_income"].apply(parse_income_value)

    if "family_dependents" in df.columns:
        df["family_dependents"] = df["family_dependents"].apply(parse_dependents_value)

    if "academic_achievement_score" in df.columns:
        df["academic_achievement_score"] = df["academic_achievement_score"].apply(parse_binary_achievement)

    if "nonacademic_achievement_score" in df.columns:
        df["nonacademic_achievement_score"] = df["nonacademic_achievement_score"].apply(parse_binary_achievement)

    # Ensure student_code exists
    if "student_code" not in df.columns or df["student_code"].isna().all():
        df["student_code"] = [f"2023{10001 + i}" for i in range(len(df))]

    # Ensure student_name exists
    if "student_name" not in df.columns:
        df["student_name"] = [f"Mahasiswa {i + 1}" for i in range(len(df))]
    else:
        df["student_name"] = df["student_name"].apply(lambda x: str(x).strip() if pd.notna(x) else None)

    df = df.reset_index(drop=True)
    dropped_count = raw_count - len(df)
    return df, raw_count, dropped_count
