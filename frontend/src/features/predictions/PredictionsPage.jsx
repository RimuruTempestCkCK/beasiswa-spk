import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/apiClient';
import { API } from '../../services/endpoints';
import PageTitle from '../../Layout/AppMain/PageTitle';

export default function PredictionsPage() {
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [formData, setFormData] = useState({
    ipk: '',
    parent_income: '',
    family_dependents: '',
    academic_achievement_score: '',
    nonacademic_achievement_score: '',
    attendance_percentage: '',
    notes: '',
  });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get(API.MODELS.LIST)
      .then((res) => {
        const items = res.data.items || res.data || [];
        const readyModels = items.filter((m) => m.status === 'ready');
        setModels(readyModels);
        if (readyModels.length > 0) {
          setSelectedModelId(readyModels[0].id);
        }
      })
      .catch(() => {});
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    apiClient
      .get(API.PREDICTIONS.LIST)
      .then((res) => {
        setHistory(res.data.items || res.data || []);
      })
      .catch(() => {});
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedModelId) {
      toast.warning('Pilih model berstatus ready terlebih dahulu!');
      return;
    }
    setLoading(true);
    setResult(null);

    const payload = {
      model_version_id: parseInt(selectedModelId),
      ipk: parseFloat(formData.ipk),
      parent_income: parseFloat(formData.parent_income),
      family_dependents: parseInt(formData.family_dependents),
      academic_achievement_score: parseFloat(formData.academic_achievement_score),
      nonacademic_achievement_score: parseFloat(formData.nonacademic_achievement_score),
      attendance_percentage: parseFloat(formData.attendance_percentage),
      notes: formData.notes,
    };

    apiClient
      .post(API.PREDICTIONS.CREATE, payload)
      .then((res) => {
        setResult(res.data);
        toast.success('Inferensi prediksi berhasil dijalankan!');
        fetchHistory();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Gagal memproses inferensi prediksi');
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <PageTitle
        heading="Prediksi Kelayakan Beasiswa"
        subheading="Inferensi klasifikasi data mahasiswa baru ke dalam klaster rekomendasi menggunakan model Backpropagation aktif"
        eyebrow="Prediksi &amp; Laporan · SPK Beasiswa"
      />

      {/* Analytical decision disclaimer banner */}
      <div
        className="alert alert-info d-flex align-items-center gap-3 mb-4"
        role="alert"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: 24, height: 24, flexShrink: 0 }}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <strong>Disclaimer Rekomendasi Keputusan:</strong> Hasil inferensi ini mengklasifikasikan data pendaftar ke dalam <strong>Pola Klaster Hasil Data Mining</strong>. Ini adalah instrumen pendukung keputusan dan <em>bukan</em> keputusan resmi penerimaan beasiswa. Keputusan final memerlukan verifikasi berkas dan otorisasi sah pihak berwenang.
        </div>
      </div>

      {models.length === 0 && (
        <div className="alert alert-warning mb-4" role="alert">
          Belum ada model Backpropagation berstatus <strong>ready</strong>. Masuk ke menu <strong>Training Model</strong> dan aktifkan model sebelum melakukan prediksi.
        </div>
      )}

      <div className="row g-3 g-xxl-4 mb-4">
        {/* Form Input */}
        <div className="col-lg-7">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Form Input 6 Variabel Mahasiswa</h2>
                <p className="panel-sub">Masukkan parameter akademik dan sosio-ekonomi calon penerima</p>
              </div>
            </div>
            <div className="panel-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="modelSelect">
                    Pilih Versi Model (Status: Ready) *
                  </label>
                  <select
                    id="modelSelect"
                    className="form-select"
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    required
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.model_name || `Model #${m.id}`} (v{m.model_version || m.version}) - Akurasi: {m.accuracy ? `${(Number(m.accuracy) * 100).toFixed(1)}%` : '-'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="ipk">
                      IPK (0.00 - 4.00) *
                    </label>
                    <input
                      id="ipk"
                      name="ipk"
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      className="form-control"
                      value={formData.ipk}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: 3.65"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="parent_income">
                      Penghasilan Orang Tua (Rp) *
                    </label>
                    <input
                      id="parent_income"
                      name="parent_income"
                      type="number"
                      min="0"
                      className="form-control"
                      value={formData.parent_income}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: 2500000"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="family_dependents">
                      Jumlah Tanggungan Keluarga *
                    </label>
                    <input
                      id="family_dependents"
                      name="family_dependents"
                      type="number"
                      min="0"
                      className="form-control"
                      value={formData.family_dependents}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: 3"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="academic_achievement_score">
                      Skor Prestasi Akademik (0 - 100) *
                    </label>
                    <input
                      id="academic_achievement_score"
                      name="academic_achievement_score"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-control"
                      value={formData.academic_achievement_score}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: 85"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="nonacademic_achievement_score">
                      Skor Prestasi Non-Akademik (0 - 100) *
                    </label>
                    <input
                      id="nonacademic_achievement_score"
                      name="nonacademic_achievement_score"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-control"
                      value={formData.nonacademic_achievement_score}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: 70"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="attendance_percentage">
                      Persentase Kehadiran (%) *
                    </label>
                    <input
                      id="attendance_percentage"
                      name="attendance_percentage"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-control"
                      value={formData.attendance_percentage}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: 95.0"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label" htmlFor="notes">
                    Catatan / Keterangan (Opsional)
                  </label>
                  <input
                    id="notes"
                    name="notes"
                    type="text"
                    className="form-control"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Contoh: Verifikasi berkas tahap 1"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 btn-lg"
                  disabled={loading || models.length === 0}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Memproses Inferensi...
                    </>
                  ) : (
                    'Jalankan Prediksi Kelayakan'
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* Prediction Output Card */}
        <div className="col-lg-5">
          <section className="panel h-100">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Hasil Inferensi Model</h2>
                <p className="panel-sub">Rekomendasi pola klaster kelayakan</p>
              </div>
            </div>
            <div className="panel-body d-flex flex-column justify-content-center align-items-center text-center p-4">
              {result ? (
                <div className="w-100">
                  <span className="avatar av-2 avatar-lg mb-3 mx-auto" style={{ width: 64, height: 64, fontSize: '1.5rem' }}>
                    C{result.predicted_cluster ?? result.cluster_label ?? '?'}
                  </span>
                  <h3 className="h4 fw-bold mb-1">
                    Klaster Prediksi: {result.predicted_cluster ?? result.cluster_label}
                  </h3>
                  <p className="text-muted small mb-3">
                    Model: {result.model_version || `Versi #${selectedModelId}`} · {new Date().toLocaleTimeString('id-ID')}
                  </p>
                  <div className="p-3 rounded mb-3" style={{ backgroundColor: 'var(--rg-surface-2)', border: '1px solid var(--rg-line)' }}>
                    <p className="small mb-0 text-start">
                      <strong>Interpretasi Klaster:</strong> Calon pendaftar memiliki pola karakteristik akademik dan ekonomi yang bersesuaian dengan klaster target <strong>#{result.predicted_cluster ?? result.cluster_label}</strong>.
                    </p>
                  </div>
                  <span className="badge bg-info-subtle text-info border border-info px-3 py-2">
                    Rekomendasi Analitis Data Mining
                  </span>
                </div>
              ) : (
                <div className="text-muted py-5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: 48, height: 48, opacity: 0.4 }}
                    className="mb-2"
                  >
                    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                  </svg>
                  <p className="mb-0">
                    Isi formulir 6 parameter di sebelah kiri dan klik <strong>Jalankan Prediksi</strong> untuk melihat hasil klaster rekomendasi.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Prediction History Table */}
      <section className="panel mb-4">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Riwayat Prediksi Terbaru</h2>
            <p className="panel-sub">Log inferensi yang telah dilakukan oleh pengguna</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchHistory}
          >
            Refresh
          </button>
        </div>
        <div className="table-wrap">
          <table className="table-data table-stack">
            <thead>
              <tr>
                <th scope="col">Waktu</th>
                <th scope="col">Model</th>
                <th scope="col" className="text-end">IPK</th>
                <th scope="col" className="text-end">Penghasilan Ortu</th>
                <th scope="col" className="text-end">Tanggungan</th>
                <th scope="col" className="text-end">Prestasi (Akad/Non)</th>
                <th scope="col" className="text-end">Kehadiran</th>
                <th scope="col">Klaster Hasil</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="num">
                    {h.created_at
                      ? new Date(h.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td>v{h.model_version_id}</td>
                  <td className="num text-end">{h.ipk ? Number(h.ipk).toFixed(2) : '-'}</td>
                  <td className="num text-end">
                    {h.parent_income
                      ? `Rp ${Number(h.parent_income).toLocaleString('id-ID')}`
                      : '-'}
                  </td>
                  <td className="num text-end">{h.family_dependents}</td>
                  <td className="num text-end">
                    {h.academic_achievement_score} / {h.nonacademic_achievement_score}
                  </td>
                  <td className="num text-end">{h.attendance_percentage}%</td>
                  <td>
                    <span className="status status-info">
                      Klaster {h.predicted_cluster}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">
                    Belum ada riwayat inferensi prediksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
