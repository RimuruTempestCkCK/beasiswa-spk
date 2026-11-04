import openpyxl, re, pandas as pd

raw_excel = r"Data Awal beasiswa.xlsx"
out_csv = r"dataset_samples/dataset_beasiswa_penelitian_5_variabel.csv"
out_xlsx = r"dataset_samples/dataset_beasiswa_penelitian_5_variabel.xlsx"

wb = openpyxl.load_workbook(raw_excel)
sheet = wb["Sheet1"]
data = list(sheet.iter_rows(values_only=True))
header = data[1]
raw_rows = data[2:]

def parse_ips(val):
    if val is None:
        return None
    s = str(val).strip()
    if s in ["-", "", "Belum ada", "None"]:
        return None
    s = s.replace(",", ".").replace(" ", "")
    match = re.search(r"([0-4](\.[0-9]+)?)", s)
    if match:
        v = float(match.group(1))
        return round(v, 2)
    return None

def parse_income(val):
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        if val == 500:
            return 500000.0
        return float(val)
    s = str(val).strip().lower()
    if s in ["-", "none", ""]:
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

def parse_dependents(val):
    if val is None:
        return 1
    s = str(val).strip().lower()
    if "tunggal" in s:
        return 1
    match = re.search(r"\d+", s)
    if match:
        return int(match.group(0))
    return 1

def parse_binary(val):
    if val is None:
        return 0
    s = str(val).strip()
    if s in ["1", "1.0", 1]:
        return 1
    return 0

clean_rows = []
for i, r in enumerate(raw_rows):
    nama = str(r[0]).strip() if r[0] else f"Mahasiswa {i+1}"
    ips = parse_ips(r[1])
    if ips is None:
        continue # Data Cleaning: hapus data tanpa nilai IPS

    inc = parse_income(r[2])
    dep = parse_dependents(r[3])
    acad = parse_binary(r[4])
    nonacad = parse_binary(r[5])

    clean_rows.append({
        "nim": f"2023{10001 + len(clean_rows)}",
        "nama": nama,
        "ipk": ips,
        "penghasilan_ortu": inc,
        "jumlah_tanggungan": dep,
        "skor_prestasi_akademik": acad,
        "skor_prestasi_nonakademik": nonacad
    })

df = pd.DataFrame(clean_rows)
df.to_csv(out_csv, index=False)
df.to_excel(out_xlsx, index=False)

# Juga perbarui file convert_dataset.py dan dataset_beasiswa_from_excel
df.to_csv(r"dataset_samples/dataset_beasiswa_from_excel.csv", index=False)
df.to_excel(r"dataset_samples/dataset_beasiswa_from_excel.xlsx", index=False)

print(f"Berhasil menghasilkan dataset penelitian dengan 5 variabel: {len(df)} baris.")
