# ==============================================================
# PIPELINE LENGKAP PENELITIAN BAZNAS
# DATA AWAL -> SELECTION -> CLEANING -> TRANSFORMATION -> MINMAX
# -> K-MEANS K=2 (CENTROID SAMA DENGAN EXCEL) -> EVALUASI DBI
# Letakkan file ini bersama:
# BAZNAS_Data_Awal_Selection_Cleaning_Transformation.xlsx
# FIX DATA BAZNAS K MEANS.xlsx
# ==============================================================
from pathlib import Path
import re, unicodedata
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import davies_bouldin_score

MASTER = Path("BAZNAS_Data_Awal_Selection_Cleaning_Transformation.xlsx")
EXCEL_KMEANS = Path("FIX DATA BAZNAS K MEANS.xlsx")
OUTPUT = Path("Hasil_Pipeline_Lengkap_Preprocessing_KMeans_DBI.xlsx")
FEATURES = ["X1_IPS", "X2_Penghasilan", "X3_Tanggungan",
            "X4_Akademik", "X5_NonAkademik"]

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
        "<1jt":500000, "<2jt":1500000, "<3jt":2500000, "<5jt":4500000,
        ">5jt":6000000, "<300rb":150000, "<500.000":250000,
        "<500,000":250000, "<500":250000, "500rb":500000
    }
    if s in mapping: return mapping[s], f"Kategori {s}"
    cleaned = re.sub(r"[^0-9]", "", s)
    if cleaned: return float(cleaned), "Nominal asli"
    return np.nan, "Tidak dapat dikonversi"

# 1. DATA AWAL (437)
if not MASTER.exists(): raise FileNotFoundError(f"File tidak ditemukan: {MASTER}")
raw = pd.read_excel(MASTER, sheet_name="Data Awal")
raw.insert(0, "ID_Baris_Asli", np.arange(1, len(raw)+1))
if len(raw) != 437: raise ValueError(f"Data awal diharapkan 437, ditemukan {len(raw)}")

# 2. DATA SELECTION
selected = raw[["ID_Baris_Asli","NOBP","Nama Lengkap",
 "Nilai Rata-Rata Akhir / IPS","Penghasilan Orang Tua",
 "Jumlah Saudara / Jumlah Tanggungan","Prestasi Akademik",
 "Prestasi Non-Akademik"]].copy()

# 3. DATA CLEANING: satu NOBP satu baris (kemunculan pertama)
selected["NOBP_key"] = selected["NOBP"].astype(str).str.strip()
dup_nobp = selected[selected.duplicated("NOBP_key", keep="first")].copy()
dedup = selected.drop_duplicates("NOBP_key", keep="first").copy()
dedup = dedup.drop(columns=["NOBP_key"])

# Validasi atribut yang dibutuhkan; IPS dan tanggungan harus numerik;
# prestasi hanya 0/1; identitas NOBP dan nama tidak boleh kosong.
dedup["IPS_num"] = dedup["Nilai Rata-Rata Akhir / IPS"].map(num)
dedup["Tanggungan_num"] = dedup["Jumlah Saudara / Jumlah Tanggungan"].map(num)
dedup["Akademik_num"] = dedup["Prestasi Akademik"].map(num)
dedup["NonAkademik_num"] = dedup["Prestasi Non-Akademik"].map(num)
dedup["Penghasilan_num"] = dedup["Penghasilan Orang Tua"].map(lambda x: income_to_rupiah(x)[0])
valid = (dedup["NOBP"].notna() & dedup["Nama Lengkap"].notna() &
         dedup["Nama Lengkap"].astype(str).str.strip().ne("") &
         dedup["IPS_num"].notna() & dedup["Penghasilan_num"].notna() &
         dedup["Tanggungan_num"].notna() &
         dedup["Akademik_num"].isin([0,1]) &
         dedup["NonAkademik_num"].isin([0,1]))
invalid = dedup.loc[~valid].copy()
clean_before_name = dedup.loc[valid].copy()
clean_before_name["Nama_Normalisasi"] = clean_before_name["Nama Lengkap"].map(name_key)
dup_name = clean_before_name[clean_before_name.duplicated("Nama_Normalisasi", keep="first")].copy()
clean = clean_before_name.drop_duplicates("Nama_Normalisasi", keep="first").copy()

# 4. OUTLIER IQR: ditandai, tidak otomatis dihapus (sesuai workbook)
outlier_audit=[]
for col,label in [("IPS_num","IPS"),("Tanggungan_num","Tanggungan")]:
    q1=clean[col].quantile(.25); q3=clean[col].quantile(.75); iqr=q3-q1
    lo=q1-1.5*iqr; hi=q3+1.5*iqr
    for ix,row in clean.loc[(clean[col]<lo)|(clean[col]>hi)].iterrows():
        outlier_audit.append({"ID_Baris_Asli":row["ID_Baris_Asli"],"NOBP":row["NOBP"],
                              "Nama Lengkap":row["Nama Lengkap"],"Atribut":label,
                              "Nilai":row[col],"Batas Bawah":lo,"Batas Atas":hi,
                              "Status":"Perlu verifikasi; tidak dihapus"})
outliers=pd.DataFrame(outlier_audit)

# 5. DATA TRANSFORMATION
clean["X1_IPS"] = clean["IPS_num"]
inc=clean["Penghasilan Orang Tua"].map(income_to_rupiah)
clean["X2_Penghasilan_Rp"] = inc.map(lambda z:z[0])
clean["Aturan_Penghasilan"] = inc.map(lambda z:z[1])
clean["X3_Tanggungan"] = clean["Tanggungan_num"]
clean["X4_Akademik"] = clean["Akademik_num"]
clean["X5_NonAkademik"] = clean["NonAkademik_num"]
transformed=clean[["ID_Baris_Asli","NOBP","Nama Lengkap","X1_IPS",
 "Penghasilan Orang Tua","X2_Penghasilan_Rp","X3_Tanggungan",
 "X4_Akademik","X5_NonAkademik","Aturan_Penghasilan"]].copy()

# 6. MIN-MAX NORMALIZATION
norm=transformed[["X1_IPS","X2_Penghasilan_Rp","X3_Tanggungan",
                  "X4_Akademik","X5_NonAkademik"]].astype(float)
mins=norm.min(); maxs=norm.max()
denom=(maxs-mins).replace(0,1)
scaled=(norm-mins)/denom
data=pd.concat([pd.Series(np.arange(1,len(clean)+1),name="No"),
 clean[["ID_Baris_Asli","NOBP","Nama Lengkap"]].reset_index(drop=True),
 scaled.reset_index(drop=True)],axis=1)
scaled.columns=FEATURES
X=scaled.to_numpy(float)

# 7. AUDIT: hasil preprocessing harus cocok dengan baseline Excel 268 data
if len(data)!=268:
    raise ValueError(f"Hasil cleaning Python {len(data)} baris, baseline penelitian 268. Periksa aturan validasi.")
if not EXCEL_KMEANS.exists(): raise FileNotFoundError(f"File tidak ditemukan: {EXCEL_KMEANS}")
excel_data=pd.read_excel(EXCEL_KMEANS,sheet_name="Data Normalisasi")
if len(excel_data)!=268: raise ValueError("Sheet Data Normalisasi Excel bukan 268 baris.")
# Bandingkan nilai normalisasi untuk memastikan pipeline benar-benar sama.
max_diff=float(np.max(np.abs(X-excel_data[FEATURES].to_numpy(float))))
if max_diff>1e-9:
    raise ValueError(f"Preprocessing Python berbeda dari Excel. Selisih maksimum={max_diff:.12g}. Jangan lanjutkan sebelum aturan diselaraskan.")

# 8. K-MEANS MANUAL K=2, centroid awal persis dari Excel
centroid_df=pd.read_excel(EXCEL_KMEANS,sheet_name="Centroid Awal")
centroids=centroid_df[FEATURES].to_numpy(float)
history=[]; previous=None
for it in range(1,101):
    dist=np.linalg.norm(X[:,None,:]-centroids[None,:,:],axis=2)
    labels=np.argmin(dist,axis=1)
    newc=np.vstack([X[labels==k].mean(axis=0) if np.any(labels==k) else centroids[k] for k in range(2)])
    moved=None if previous is None else int(np.sum(labels!=previous))
    history.append((centroids.copy(),dist.copy(),labels.copy(),newc.copy(),moved))
    if previous is not None and np.array_equal(labels,previous): break
    previous=labels.copy(); centroids=newc
else: raise RuntimeError("Tidak konvergen dalam 100 iterasi.")
final_labels=history[-1][2]
final_names=np.where(final_labels==0,"C1","C2")

# 9. DBI setiap kandidat K=2..6 dihitung Python
dbi_rows=[]
for k in range(2,7):
    model=KMeans(n_clusters=k,random_state=42,n_init=20,max_iter=300,algorithm="lloyd")
    lab=model.fit_predict(X)
    dbi_rows.append({"K":k,"DBI":float(davies_bouldin_score(X,lab)),
                     "Iterasi KMeans":int(model.n_iter_)})
dbi_table=pd.DataFrame(dbi_rows)
optimal_k=int(dbi_table.loc[dbi_table["DBI"].idxmin(),"K"])
dbi_manual_k2=float(davies_bouldin_score(X,final_labels))

# 10. OUTPUT DETAIL
iter_rows=[]; centroid_rows=[]; detail_sheets={}
for i,(c0,d,lab,cnew,moved) in enumerate(history,1):
    iter_rows.append({"Iterasi":i,"Anggota C1":int((lab==0).sum()),
                      "Anggota C2":int((lab==1).sum()),
                      "Data berpindah": "-" if moved is None else moved,
                      "Status":"Awal" if moved is None else ("Konvergen" if moved==0 else "Berlanjut")})
    for k in range(2):
        centroid_rows.append({"Iterasi":i,"Jenis":"Centroid Awal","Cluster":f"C{k+1}",**dict(zip(FEATURES,c0[k]))})
        centroid_rows.append({"Iterasi":i,"Jenis":"Centroid Baru","Cluster":f"C{k+1}",**dict(zip(FEATURES,cnew[k]))})
    det=data.copy()
    det["Jarak C1"]=d[:,0]; det["Jarak C2"]=d[:,1]; det["Jarak Minimum"]=d.min(axis=1)
    det["Cluster"]=np.where(lab==0,"C1","C2")
    detail_sheets[f"Iterasi {i}"]=det
hasil=data[["No","NOBP","Nama Lengkap"]].copy()
hasil["Cluster"]=final_names
hasil["Interpretasi Cluster"]="Cluster hasil K-Means; label layak/tidak layak perlu validasi kriteria BAZNAS"

ringkasan=pd.DataFrame([
 ["Data Awal",len(raw)],["Data setelah deduplikasi NOBP",len(dedup)],
 ["Data tidak valid dikeluarkan",len(invalid)],["Data sebelum deduplikasi nama",len(clean_before_name)],
 ["Nama berulang dihapus",len(dup_name)],["Data final",len(clean)]
],columns=["Tahap","Jumlah"])
param=pd.DataFrame({"Variabel":FEATURES,"Minimum":mins.values,"Maksimum":maxs.values})
with pd.ExcelWriter(OUTPUT,engine="openpyxl") as w:
    raw.to_excel(w,sheet_name="Data Awal",index=False)
    selected.drop(columns=[],errors="ignore").to_excel(w,sheet_name="Data Selection",index=False)
    dup_nobp.to_excel(w,sheet_name="NOBP Berulang Dihapus",index=False)
    invalid.to_excel(w,sheet_name="Missing Tidak Valid",index=False)
    dup_name.to_excel(w,sheet_name="Nama Sama Dihapus",index=False)
    clean.to_excel(w,sheet_name="Data Cleaning Final",index=False)
    outliers.to_excel(w,sheet_name="Audit Outlier IQR",index=False)
    transformed.to_excel(w,sheet_name="Transformasi Numerik",index=False)
    param.to_excel(w,sheet_name="Parameter MinMax",index=False)
    data.to_excel(w,sheet_name="Normalisasi MinMax",index=False)
    ringkasan.to_excel(w,sheet_name="Ringkasan Preprocessing",index=False)
    pd.DataFrame(iter_rows).to_excel(w,sheet_name="Ringkasan Iterasi",index=False)
    pd.DataFrame(centroid_rows).to_excel(w,sheet_name="Centroid Tiap Iterasi",index=False)
    for name,frame in detail_sheets.items(): frame.to_excel(w,sheet_name=name,index=False)
    dbi_table.to_excel(w,sheet_name="Evaluasi DBI Python",index=False)
    pd.DataFrame([{"K Optimal DBI":optimal_k,"DBI terendah":dbi_table["DBI"].min(),
                   "DBI K2 manual Excel-Python":dbi_manual_k2,
                   "Selisih normalisasi maksimum vs Excel":max_diff}]).to_excel(w,sheet_name="Kesimpulan",index=False)
    hasil.to_excel(w,sheet_name="Hasil Clustering",index=False)

print("=== PIPELINE PREPROCESSING SAMPAI K-MEANS ===")
print(ringkasan.to_string(index=False))
print(f"Jumlah data normalisasi: {len(data)}; selisih maksimum dengan Excel: {max_diff:.12g}")
print(pd.DataFrame(iter_rows).to_string(index=False))
print("Anggota akhir:",pd.Series(final_names).value_counts().to_dict())
print("DBI kandidat K=2..6:")
print(dbi_table.to_string(index=False))
print(f"K optimal: {optimal_k}; DBI K2 manual: {dbi_manual_k2:.12f}")
print("Output:",OUTPUT.resolve())
