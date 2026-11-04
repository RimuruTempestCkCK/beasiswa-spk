# Dataset Penelitian SPK Beasiswa Universitas Dharma Andalas

Folder ini berisi dataset yang disesuaikan dengan **Kerangka Penelitian Gambar 3.1** menggunakan **tepat 5 variabel penelitian**.

---

## 📁 Daftar File Dataset Penelitian

| Nama File | Format | Jumlah Baris Valid | Keterangan |
|---|---|---|---|
| `dataset_beasiswa_penelitian_5_variabel.csv` | CSV | 416 data | **Dataset Acuan Penelitian**: Hasil cleaning & transformasi dari data historis `Data Awal beasiswa.xlsx` Universitas Dharma Andalas. |
| `dataset_beasiswa_penelitian_5_variabel.xlsx` | Excel | 416 data | Format Excel untuk pengujian import langsung via Dashboard. |

---

## 📋 5 Variabel Penelitian (Gambar 3.1)

1. `ipk`: Nilai Rata-rata Akhir / IPS (skala numerik `0.00` - `4.00`)
2. `penghasilan_ortu`: Total penghasilan orang tua per bulan dalam Rupiah
3. `jumlah_tanggungan`: Jumlah tanggungan keluarga / saudara (numerik bulat $\ge 0$)
4. `skor_prestasi_akademik`: Prestasi Akademik (skala biner: `1` = Ada, `0` = Tidak Ada)
5. `skor_prestasi_nonakademik`: Prestasi Non-Akademik (skala biner: `1` = Ada, `0` = Tidak Ada)

*Catatan: Kolom identitas (`nim` dan `nama`) hanya digunakan sebagai metadata tampilan dan tidak diikutkan dalam matriks numerik Machine Learning.*

---

## 🚀 Cara Import ke Dashboard SPK

1. Buka dashboard web aplikasi SPK Beasiswa.
2. Masuk ke menu **Dataset Management** / **Dataset**.
3. Buat Batch baru (klik **Tambah Batch / Buat Batch**), misal: *Dataset Beasiswa Undha 2026*.
4. Klik tombol **Import File** pada batch yang baru dibuat.
5. Anda dapat mengunggah langsung file `dataset_beasiswa_penelitian_5_variabel.csv` atau bahkan file mentah `Data Awal beasiswa.xlsx` (sistem telah dilengkapi *automated raw cleaner*).
6. Lakukan **Preview** dan konfirmasi untuk menyimpan data ke database.
