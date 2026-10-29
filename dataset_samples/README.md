# Contoh Dataset untuk SPK Beasiswa

Folder ini berisi file dataset siap pakai yang sudah disesuaikan dengan format dan validasi sistem SPK Beasiswa. Anda dapat langsung mengunggah (*import*) file-file ini melalui menu **Dataset** di dashboard web.

---

## 📁 Daftar File Dataset (Semua Format CSV)

| Nama File | Format | Jumlah Baris | Peruntukan |
|---|---|---|---|
| `dataset_beasiswa_150_records.csv` | CSV | 150 data | **Uji Coba Cepat**: Cocok untuk verifikasi pipeline impor, preprocessing, dan alur aplikasi. |
| `dataset_beasiswa_500_records.csv` | CSV | 500 data | **Menengah / Standar**: Cukup stabil untuk pelatihan model K-Means & Backpropagation. |
| `dataset_beasiswa_1200_records_optimal.csv` | CSV | 1.200 data | **Optimal (>1.000 data)**: Memberikan akurasi tinggi, pembagian test-split yang representatif, serta mencegah overfitting pada neural network. |

---

## 📋 Struktur Kolom yang Digunakan

Semua file telah dilengkapi kolom identitas dan 6 fitur inti yang otomatis dipetakan oleh sistem:

1. `nim`: Nomor Induk Mahasiswa (contoh: `202300001`)
2. `nama`: Nama lengkap mahasiswa
3. `ipk`: Nilai IPK (skala `0.00` - `4.00`)
4. `penghasilan_ortu`: Total penghasilan orang tua per bulan dalam Rupiah
5. `jumlah_tanggungan`: Jumlah anggota keluarga tanggungan
6. `skor_prestasi_akademik`: Skor kejuaraan / sertifikasi akademik (`0.0` - `100.0`)
7. `skor_prestasi_nonakademik`: Skor keikutsertaan / prestasi organisasi / minat bakat (`0.0` - `100.0`)
8. `persentase_kehadiran`: Tingkat kehadiran kuliah (`0.0` - `100.0`)

---

## 🚀 Cara Import ke Aplikasi

1. Buka dashboard web aplikasi SPK Beasiswa.
2. Masuk ke menu **Dataset Management** / **Dataset**.
3. Buat Batch baru (klik **Tambah Batch / Buat Batch**), beri nama batch (misal: *Dataset Pelatihan 2024*).
4. Klik tombol **Import File** pada batch yang baru dibuat.
5. Pilih salah satu file dari folder `dataset_samples/` ini.
6. Lakukan **Preview** dan konfirmasi untuk menyimpan data ke database.
