# Data Dictionary - Sistem SPK Prediksi Kelayakan Beasiswa

## Enam Variabel Input Algoritma

| Variabel | Nama Kolom DB | Tipe Data | Rentang Valid | Keterangan |
|---|---|---|---|---|
| Indeks Prestasi Kumulatif | `ipk` | DECIMAL(4,2) | 0.00 – 4.00 | Konfirmasi skala dengan sistem akademik kampus |
| Penghasilan Orang Tua | `parent_income` | DECIMAL(15,2) | > 0 | Satuan: Rupiah per bulan |
| Jumlah Tanggungan Keluarga | `family_dependents` | SMALLINT UNSIGNED | ≥ 0 | Bilangan bulat; definisi tanggungan harus konsisten |
| Prestasi Akademik | `academic_achievement_score` | DECIMAL(8,3) | ≥ 0 | Perlu kamus data; skala belum final |
| Prestasi Nonakademik | `nonacademic_achievement_score` | DECIMAL(8,3) | ≥ 0 | Perlu kamus data; skala belum final |
| Tingkat Kehadiran | `attendance_percentage` | DECIMAL(5,2) | 0.00 – 100.00 | Persentase; definisi periode harus konsisten |

## Aturan Validasi

### IPK
- Rentang: 0.00 – 4.00 (konfirmasi dengan institusi)
- Nilai negatif: TIDAK VALID
- Nilai > 4.00: TIDAK VALID kecuali ada kebijakan khusus

### Penghasilan Orang Tua
- Satuan: Rupiah per bulan
- Nilai ≤ 0: TIDAK VALID
- Konfirmasi satuan dari sumber data aktual

### Jumlah Tanggungan Keluarga
- Bilangan bulat non-negatif
- Definisi: siapa yang dihitung sebagai tanggungan harus disepakati sebelum pengumpulan data

### Prestasi Akademik & Nonakademik
- **BELUM FINAL** – perlu kesepakatan kampus/peneliti
- Contoh pendekatan: berbasis jumlah prestasi, tingkat prestasi (lokal/nasional/internasional), atau skor berbobot
- Aturan yang disepakati harus terdokumentasi dan digunakan konsisten

### Tingkat Kehadiran
- Persentase 0–100
- Definisi periode (semester, tahun) harus konsisten di seluruh dataset

## Format CSV yang Diterima
```
student_code,student_name,ipk,parent_income,family_dependents,academic_achievement_score,nonacademic_achievement_score,attendance_percentage
```

- `student_code`: opsional, identifier bisnis
- `student_name`: opsional, gunakan pseudonim untuk privasi
- Kolom angka harus berupa angka valid (titik sebagai desimal)
- Baris header wajib ada

## Catatan Penting
- NIM dan nama TIDAK digunakan sebagai input algoritma
- Data mentah tidak ditimpa setelah preprocessing
- Scaler di-fit hanya pada data training
